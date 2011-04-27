// PLUGIN: Wordriver

(function (Popcorn) {

  var container = {},
      spanLocation = 0,
      knownSpeaker = false,
      knownIndex = 0,
      unknownIndex = 0,
      setupContainer = function( target ) {
  
        container[ target ] = document.createElement( "div" );
        document.getElementById( target ).appendChild( container[ target ] );
        
        container[ target ].style.height = "100%";
        container[ target ].style.position = "relative";
        container[ target ].style.overflow = "hidden";
        
        return container[ target ];
      };

  Popcorn.plugin( "wordriver" , {
    
      manifest: {},

      _setup: function( options ) {

	var newSpeaker = options.text.indexOf(":");
	var newBracket = options.text.indexOf("[");
	var text = options.text;

	if( newSpeaker >= 0 ) {
		knownSpeaker = false;
		for( var i in options.colors.known ) {
			for( var j in options.colors.known[ i ].name ) {
				if( options.text.toLowerCase().indexOf( options.colors.known[ i ].name[ j ].toLowerCase() ) >= 0 ) {
					knownSpeaker = true;
					knownIndex = i;
					break;
				}
			}
			if( knownSpeaker ) break;
		}
	}

	if( !knownSpeaker && newSpeaker >= 0 ) {
		unknownIndex = (unknownIndex + 1 < options.colors.unknown.length) ? unknownIndex + 1 : 0;
	}

	if( newSpeaker >= 0 ) {
		text = options.text.substr( newSpeaker + 1 );
	}

	if( newBracket >= 0 ) {
		text = "";
	}

        options._duration = options.end - options.start;
        options._container = container[ options.target ] || setupContainer( options.target );
        
        options.opacity.duration = options.opacity.duration !== undefined ? options.opacity.duration : 1;

        options.word = document.createElement( "span" );
        options.word.style.position = "absolute";

        options.word.style.whiteSpace = "nowrap";
        options.word.style.opacity = options.opacity.start;

        options.word.style.MozTransitionProperty = "opacity, -moz-transform";
        options.word.style.webkitTransitionProperty = "opacity, -webkit-transform";
        options.word.style.OTransitionProperty = "opacity, -o-transform";
        options.word.style.transitionProperty = "opacity, transform";

        options.word.style.MozTransitionDuration =
          options.word.style.webkitTransitionDuration = 
          options.word.style.OTransitionDuration = 
          options.word.style.transitionDuration = options.opacity.duration + "s, " + options._duration + "s";

        options.word.style.MozTransitionTimingFunction =
          options.word.style.webkitTransitionTimingFunction =
          options.word.style.OTransitionTimingFunction =
          options.word.style.transitionTimingFunction = "linear";

        options.word.innerHTML = text;

        if( knownSpeaker ) {
	        if( options.word.classList ) {
	        	options.word.classList.add( options.colors.known[ knownIndex ].className );
	        } else {
	        	options.word.className = options.colors.known[ knownIndex ].className;
	        }
	} else {
	        if( options.word.classList ) {
	        	options.word.classList.add( options.colors.unknown[ unknownIndex ] );
	        } else {
	        	options.word.className = options.colors.unknown[ unknownIndex ];
	        }
	}
      },
      start: function( event, options ){

        options._container.appendChild( options.word );

        // Resets the transform when changing to a new currentTime before the end event occurred.
        options.word.style.MozTransform =
          options.word.style.webkitTransform =
          options.word.style.OTransform =
          options.word.style.transform = "";

/*
	// Helps reduce the bunch of words appearing when changing to a new currentTime. Otherwise all words in the period between start and end time are put in the river.
	// Problem with this solution is that browser lag can stop words from appearing in the river. i.e., If the browser freezes up for a moment.
	if(this.currentTime() - options.start > 1) {
	        options.word.style.opacity = 0;
		return;
	}
*/

        options.word.style.fontSize = ~~( 30 + 20 * Math.random() ) + "px";
        spanLocation = spanLocation % ( options._container.offsetWidth - options.word.offsetWidth );
        options.word.style.left = spanLocation + "px";
        spanLocation += options.word.offsetWidth + 10;

        var height = window.getComputedStyle(options._container.parentNode, null).getPropertyValue("height");

        options.word.style.MozTransform =
          options.word.style.webkitTransform =
          options.word.style.OTransform =
          options.word.style.transform = "translateY(" + height + ")";
        
        if( options.middle !== undefined && options.start !== options.middle ) {
	        options.word.style.opacity = options.opacity.middle;

		setTimeout( function() {
		  options.word.style.opacity = options.opacity.end;
		}, (options.middle - options.start) * 1000 );
	} else {
	        options.word.style.opacity = options.opacity.end;
	}

      },
      end: function( event, options ){

        options._container.removeChild( options.word );
        options.word.style.opacity = options.opacity.start;

        options.word.style.MozTransform =
          options.word.style.webkitTransform =
          options.word.style.OTransform =
          options.word.style.transform = "";
      }
  });

})( Popcorn );
