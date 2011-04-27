/*
 * Authors:      
 * Mark Boas @maboa
 * Mark Panaghiston @thepag 
 * Steven Weerdenburg
 */

$(document).ready(function(){  
	
	// super commenter - to be used to decide what to do with comment
	
	var admin = "Radiolab";  
	var mediaId = "13580897";
	var apiKey = "CHAyhB5IisvLqqzGYNYbmA";
	var duration = 1016; // change this later for flexibility - the issue is that we don't know the duration until the track has completely loaded
	       
	// Hide the URL bar for iPhone / iPad         
	
	addEventListener("load", function(){
		setTimeout(updateLayout, 0);
	}, false);  
	
	/*document.ontouchmove = function (event) {
	    if (!event.elementIsEnabled) {
	        event.preventDefault();
	    }
	};
	
	document.getElementById('transcript').ontouchmove = function (event) { 
	    event.elementIsEnabled = true;
	};*/
	
	

    function updateLayout(){
		if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('iPod') != -1 || navigator.userAgent.indexOf('iPad') != -1) 
		{
			//setTimeout("window.scrollTo(0, 14)", 0);	
			setTimeout(function(){
				window.scrollTo(0, 1);
			}, 100);     
		}
	}

	
	// load transcript - @maboa 
	// and wait until it is in place before doing anything
	
 	$('#transcript-content').load('transcript.html',function(){
		setup();
	});   
          
	

	var client_id = '?client_id='+apiKey;                  
	var myPlayer = $("#jquery_jplayer_1");  
	  
	// 
	
	function setup() { 

		$.ajax({
			url: "http://api.soundcloud.com/tracks/"+mediaId+".json" + client_id,
			dataType: 'jsonp',
			success: function(data) {

				myPlayer.jPlayer({
					ready: function (event) {
						$(this).jPlayer("setMedia", {
							mp3: "http://api.soundcloud.com/tracks/"+mediaId+"/stream?client_id="+apiKey,
							oga: "http://api.soundcloud.com/tracks/"+mediaId+"/download?client_id="+apiKey,

							//mp3: data.stream_url + client_id,
							//oga: data.download_url + client_id
						});
						if(event.jPlayer.html.used && event.jPlayer.html.audio.available) {
							initPopcorn('#' + $(this).data("jPlayer").internal.audio.id);
						}
					},
					swfPath: "js/libs", // Not important for HTML only solution.
					// solution: "html",
					supplied: "mp3,oga",
					cssSelectorAncestor: "",
					cssSelector: {
						play: "#simple-controls .jp-play",
						pause: "#simple-controls .jp-pause",
						seekBar: "#waveform .jp-seek-bar",
						playBar: "#waveform .jp-play-bar"
					},
					preload: "none"
				});

				$("#waveform-img").attr("src", data.waveform_url);
			}
		});   
	   
	}

	function initPopcorn(id) {

		//var p = Popcorn(id);   
		
		// @maboa changes for comment functionality
		
		var p = Popcorn(id)
			.scComments({
		        apikey: apiKey,
		        mediaid: mediaId,
				limit: 500
		    } )
			.listen( 'scCommentIn', function( comment ) {   
				var text = comment.text;     
				var url1 = "";
				var url2 = ""; 
				var space = 0; 
				var isUrl1Image = false;
				var isUrl2Image = false;
   
				if (comment.user.name == admin) {
					// search the contents     
					
				    // replacing newline with space
					text = text.replace('\n',' ');  
					text = text.replace('\r',' ');
					
					
					var urlStart = text.indexOf('http://');      
					
					if (urlStart >= 0) {

						text = text.substr(urlStart,text.length);     
						space = text.indexOf(' ');  
					
						if (space < 0) {
							url1 = text; 
							text = "";
						} else {
							url1 = text.substr(0,space);   
							text = text.substr(space,text.length); 
						}

						urlStart = text.indexOf('http://');     

						if (urlStart >= 0) { 
							text = text.substr(urlStart,text.length);  
							space = text.indexOf(' ');  
					   
							if (space < 0) {
								url2 = text;
							} else {
								url2 = text.substr(0,space); 
							}    
						}   
					
                        isUrl1Image = url1.indexOf('.jpg') >= 0;
						isUrl2Image = url2.indexOf('.jpg') >= 0;      
						
						//console.log('isUrl1Image: '+isUrl1Image);  
						//console.log('isUrl2Image: '+isUrl2Image);  
				    
						if (url2.length > 0 && isUrl2Image) {
							$('#images-square-left').css("background-image", "url("+url1+")");   
							$('#images-square-right').css("background-image", "url("+url2+")"); 
							$('#images-widescreen').hide();
							$('#images-square').show();  
						} else if (url1.length > 0 && isUrl1Image){
							$('#images-widescreen').css("background-image", "url("+url1+")");      
							$('#images-square').hide();  
							$('#images-widescreen').show();
						}    
						
					}    
				} 
				
				if (isUrl1Image == false) { // is false if no URL, not admin or isn't an image   
					formatComment( comment );
		    	}

				
			})
			.listen( 'scCommentOut', function( comment ) {
			    //document.getElementById('commentOutput').innerHTML = '';
			})
			.listen( 'scLoadedmetadata', function( data ) {

				   var comments = this.scComments.tracks[mediaId].comments;
				   var lis = "";
					Popcorn.forEach( comments, function ( obj ) { 
					  var pc = (100*obj.start)/duration;   
					  var scTime = obj.start*1000;
					  
					  if (!(obj.user.name == admin && obj.text.indexOf('.jpg') >= 0)){   
  						lis = lis + '<li class="timestamped-comment track-owner" style="position:absolute; left: '+pc+'%;" data-sc-comment-timestamp="'+obj.start+'"><div class="marker" style="width: 1px"><a class="user-image-tiny" style="background-image: url('+obj.user.avatar.replace('large','tiny')+')" href="http://soundcloud.com/radiolab/hairpart#new-timed-comment-at-'+scTime+'" target="_blank"></a></div></li>';  
					  }
					});  
					$('#comments-public').append(lis);   
					          
					// blink pause button
					
					$('.jp-pause').addClass('jp-pause-flash');  
                   	setTimeout(function(){
						$('.jp-pause').removeClass('jp-pause-flash'); 
					}, 400);

				Popcorn.sortTracks( p );
			});
			                                                 
			// can we make this delegate - more efficient
			//$('.timestamped-comment').delegate('a','click',function(){  
			$('.timestamped-comment a').live('click',function() {
				return false; // overkill - see http://fuelyourcoding.com/jquery-events-stop-misusing-return-false/
			});  
			
			// $('.comment-holder').click(function() { 
			
			$('#comments-public').click(function(e) {    
				var offset = $(this).offset();
			    var x = e.pageX - offset.left;
			 	var width = $(this).width();
				var time = Math.floor((x/width)*duration*1000);      
				window.open('http://soundcloud.com/radiolab/hairpart#new-timed-comment-at-'+time);
				
				//console.log(time);
				//console.log($(this).position)
				//myPlayer.jPlayer("play",jumpTo);
				return false; // overkill - see http://fuelyourcoding.com/jquery-events-stop-misusing-return-false/
			});

		/* Colors from Squares:
		 * Teal:         #6cdbd5
		 * Light Teal:   #beecea
		 * Orange:       #fd7426
		 * Light Orange: #fd9d6d
		 * Grey:         #88898b
		 */

		// Changes color on text containing either ':' or '[' using unknown array.
		// Known speakers use the object,
		var wrColors = {
			known: [ // Array of objects for known speakers
				{
					name: [
						"Robert Krulwich",
						"R.K."
					],
					className: "speaker-robert-krulwich"
				}, {
					name: [
						"Jad Abumrad",
						"J.A."
					],
					className: "speaker-jad-abumrad"
				}, {
					name: [
						"John Walter",
						"J.W."
					],
					className: "speaker-john-walter"
				}
			],
			unknown: [ // Array of CSS Class name to use for unknown speakers.
				"speaker-1",
				"speaker-2",
				"speaker-3"
			]
		};

		$("#transcript-content span").each(function(i) {

			p.transcript({
				time: $(this).attr("m") / 1000, // seconds
				futureClass: "transcript-grey",
				target: this
			})
			.wordriver({
				start: $(this).attr("m") / 1000, // seconds
				middle: ( $(this).attr("m") / 1000 ) + 4, // seconds
				end: ( $(this).attr("m") / 1000 ) + 6, // seconds
				// end - start is the speed in which the word moves.
				// make middle = start to remove its effect competely. Or middle undefined.
				text: $(this).text(),
				target: "wordsriver",
				opacity: {
					start: 0,
					middle: 0.5,
					end: 0,
					duration: 1
				},
				colors: wrColors
			});  
		});
		Popcorn.sortTracks( p );
		myPlayer.jPlayer("play"); // Auto-play the media after all the processing has been completed.
	}  
	

	// transcript links to audio
	
	$('#transcript').delegate('span','click',function(){  
		var jumpTo = $(this).attr('m')/1000; 

		myPlayer.jPlayer("play",jumpTo);    

		return false;
	});    
	
	// transcript/image toggle
		
	var oldTranscriptTop = 0; // Need to store this value for: Chrome, Safari and IE9. They reset the scroll to zero when hidden.

	$('.show-trans').click(function() {

		$('#transcript').show(); // Show it first!
		$('#transcript').scrollTop( oldTranscriptTop ); // Correct the position after displaying.

		var $target = $("#transcript-content span.transcript-grey:first").parent(); // The paragraph of the word.
		$target = $target.prev().length ? $target.prev() : $target; // Select the previous paragraph if there is one.
    
    // SW - Transcript has progressed beyond last paragraph, select last. Prevents crash in jquery
    $target = $target.length ? $target : $("#transcript-content span").last().parent();
    
    $("#transcript").stop().scrollTo($target, 800, {axis:'y',margin:true});
    
		$('#images').hide();  
		$(this).hide();
		$('.hide-trans').show();
		$('#destructions').fadeOut();
		return false;
	});
	
	
	$('.hide-trans').click(function() {  

		oldTranscriptTop = $('#transcript').scrollTop(); // Store the position before hiding

	        $('#transcript').hide();
		$('#images').show();  
		$(this).hide();
		$('.show-trans').show();
		return false;
	});

	$('.jp-restart').click( function() {
		myPlayer.jPlayer("play", 0);
		return false;
	});

	// some utility functions useful for comments from Steven
	
	// This is simply a callback function
	    function formatComment( comment ) {
	      var floor = Math.floor,
	          round = Math.round;

	      // Calclate the difference between d and now, express as "n units ago"
	      function ago( d ) {
	        var diff = ( ( new Date() ).getTime() - d.getTime() )/1000;

	        function pluralize( value, unit ) {
	          return value + " " + unit + ( value > 1 ? "s" : "") + " ago";
	        }

	        if ( diff < 60 ) {
	          return pluralize( round( diff ), "second" );
	        }
	        diff /= 60;

	        if ( diff < 60 ) {
	          return pluralize( round( diff ), "minute" );
	        }
	        diff /= 60;

	        if ( diff < 24 ) {
	          return pluralize( round( diff ), "hour" );
	        }
	        diff /= 24;

	        // Rough approximation of months
	        if ( diff < 30 ) {
	          return pluralize( round( diff ), "day" );
	        }

	        if ( diff < 365 ) {
	          return pluralize( round( diff/30 ), "month" );
	        }

	        return pluralize( round( diff/365 ), "year" );
	      }

	      // Converts sec to [hr.]min.sec
        // Seconds are 0-prefixed, minutes are 0-prefixed if hours exist.
	      function timeToFraction ( totalSec ) {
	        var hr = floor( totalSec / 3600 ),
              min = floor( totalSec / 60 ),
	            sec = floor( totalSec % 60 ),
              ret = min + "." + ( sec < 10 ? "0" : "" ) + sec;
              
          // SW - Added this to account for longer segments
          // Also changed calculations to floor all rather than round to be consistent with Soundcloud calculations
          if ( hr ) {
            ret = hr + "." +  ( min < 10 ? "0" : "" ) + ret;
          }          

          return ret;
	      }	 
	
		  document.getElementById('commentOutput').innerHTML = '<div><a href="' + comment.user.profile + '">'
		              + '<img width="16px height="16px" src="' + comment.user.avatar + '"></img>'
		              + comment.user.name + '</a> at ' + timeToFraction( comment.start ) + ' '
		              + ago( comment.date )
		              + '<br />' + comment.text + '</span>';  
	   }

});
