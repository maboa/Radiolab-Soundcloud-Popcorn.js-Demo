// PLUGIN: Subtitle

(function (Popcorn) {
  /**
   * ScComments popcorn plug-in 
   * Retrieves comments from soundcloud for a media id and api key
   * Listen for scCommentIn and scCommentOut events to act. Acts as
   * a composite pattern for plugins (scComments and scComment)
   * 
   * @param {Object} options
   * 
   * Example:
     var p = Popcorn('#video')
        .scComments({
          apikey:    '1234567890abcdef',   // mandatory, a soundcloud api key
          mediaid:   1234,                 // mandatory, the id of a media
        } )
   *
   */
   
   // A single comment
  Popcorn.plugin( "scComment" , (function() {
    return {
      _setup: function( options ) {  },
      /**
       * @member scComments 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      start: function(event, options){
        this.trigger( "scCommentIn", options.comment );
      },
      /**
       * @member scComments 
       * The end function will be executed when the currentTime 
       * of the video  reaches the end time provided by the 
       * options variable
       */
      end: function(event, options){
        this.trigger( "scCommentOut", options.comment );
      }
    }
  })());

  // A composite of comments
  Popcorn.plugin( "scComments" , (function() {
    var comments = [];
    
    return {
      manifest: {
        about:{
          name: "Popcorn scComments Plugin",
          version: "0.5",
          author:  "Steven Weerdenburg",
          website: "http://sweerdenburg.wordpress.com/"
        },
        options:{
          start    : {elem:'input', type:'text', label:'In'},
          end      : {elem:'input', type:'text', label:'Out'},
          target  :  'Subtitle-container',          
          apikey    :{elem:'input', type:'text', label:'In'},
          mediaid    :{elem:'input', type:'text', label:'In'},
		  limit : {elem:'input', type:'text', label:'In'}
        }
      },
      
      //tracks: {},

      _setup: function( options ) {
        if ( !options || !options.mediaid ) {
          throw "Must supply a media id!";
        } else if ( !options.apikey ) {
          throw "Must supply an api key!"
        }
        
        // Expose a list of tracks
        this.scComments.tracks = this.scComments.tracks || {};
        this.scComments.tracks[options.mediaid] = {};
        
        // Default them to 0 and undef. Undef will become media duration
        options.start = 0; 
        options.end = 0; // MJP: Bug in Popcorn, the default duration() NaN is not being corrected.
        
        var pop = this,
            curl = 'http://api.soundcloud.com/tracks/' + options.mediaid + '.js?client_id=' + options.apikey + "&callback=jsonp";

        // MJP: The xhr() success(data):
        // MJP:   - The JSONP type xhr() has the json object in data
        // MJP:   - The JSON type xhr() has the json object in data.json
        
        Popcorn.xhr({
          url: curl,
          dataType: "jsonp",
          success: function( data ) {
            options.waveform = pop.scComments.tracks[options.mediaid].waveform = data.waveform_url; 
            // pop.trigger( 'scLoadedmetadata', data );
          }
        });

        Popcorn.xhr({
          url: 'https://api.soundcloud.com/tracks/' + options.mediaid + '/comments.json?client_id=' + options.apikey + "&limit="+ options.limit + "&callback=jsonp",
          dataType: "jsonp",
          success: function( data ) {
            var x, y, len, tmp;
            
            if ( data.error ) {
              throw error;
            }         
            
			 
            
            Popcorn.forEach( data, function ( obj ) {
              var comment = {
                start: obj.timestamp/1000,
                date: new Date( obj.created_at ),
                text: obj.body,
                user: {
                  name: obj.user.username,
                  profile: obj.user.permalink_url,
                  avatar: obj.user.avatar_url
                }
              };
              
              comments.push( comment );
            });      

			// MB exposing the comments - am I doing it right?
			options.comments = pop.scComments.tracks[options.mediaid].comments = comments;
            
            // Sort comments by start time
            for(len = comments.length; len > 1; len--) {
              for(y = 0; y < len - 1; y++) {
                if(comments[y].start > comments[y+1].start) {
                  tmp = comments[y+1];
                  comments[y+1] = comments[y];
                  comments[y] = tmp;
                }
              }
            }
            
            // for(x = 0, len = comments.length; x < len - 1; x++) {
            for(x = 0, len = comments.length; x < len; x++) { // MJP: Removed the minus 1
              tmp = comments[x];
              // Infer end time
              // tmp.end = (comments[x+1].start-0.001) || Number.MAX_VALUE;
              tmp.end = comments[x+1] && (comments[x+1].start-0.001) || Number.MAX_VALUE; // MJP: Removed error on last comment
              
              pop.scComment({
                start: tmp.start,
                end: tmp.end,
                target: '',
                comment: tmp
              });
            }
            pop.trigger( 'scLoadedmetadata', data ); // MJP: Moved here so event is useful for comments,
          }
        });
      },
      /**
       * @member scComments 
       * The start function will be executed when the currentTime 
       * of the video  reaches the start time provided by the 
       * options variable
       */
      start: function(event, options){
      },
      /**
       * @member scComments 
       * The end function will be executed when the currentTime 
       * of the video  reaches the end time provided by the 
       * options variable
       */
      end: function(event, options){
      }
   
    }
  })());

})( Popcorn );