/**
 * draggable.js
 * 
 * This code allows you to drag elements on desktop devices and touch devices.
 * 
 * Note: Complex UI such as rotated elements isn't supported. The reason is that if an
 * element is rotated by the `transform` CSS property, the `left` and `top` properties
 * of the computed style will differ from those of the inline style.
 */

commonplace.ui = commonplace.ui || {};


( function( cp ) {
	'use strict';
	
	var wrap = cp.wrapElement;
	
	/**
	 * Enable the specified element to be dragged.
	 */
	function Dragger( follower, opts ) {
		opts = opts || {};
		
		/**
		 * The element following the mouse cursor on mousemove events.
		 */
		this.follower = wrap( follower );
		
		/**
		 * The parent element of the dragged element.
		 */
		this.parent = wrap( follower.parentElement );
		
		/**
		 * The element which listens mousedown events.
		 */
		this.handle = opts.handle ? wrap( opts.handle ) : this.follower;
		
		/**
		 * Event listeners.
		 */
		this.listener = {
			onMouseDown: startDrag.bind( this, opts.onSetup, opts.onStarted ),
			onMouseMove: drag.bind( this, opts.onMove ),
			onMouseUp: endDrag.bind( this, opts.onEnd ),
			onScroll: scroll.bind( this, opts.onMove ),
		};
	}
	
	
	/* ================================================================================ */
	/*   Public methods  */
	
	var methods = Dragger.prototype;
	
	methods.enable = function() {
		this.handle.el.addEventListener( 'mousedown' , this.listener.onMouseDown );
		this.handle.el.addEventListener( 'touchstart', this.listener.onMouseDown, listenerOptions );
	}
	
	methods.disable = function() {
		this.handle.el.removeEventListener( 'mousedown' , this.listener.onMouseDown );
		this.handle.el.removeEventListener( 'touchstart', this.listener.onMouseDown );
	}
	
	
	/* ================================================================================ */
	/*   Private methods   */
	
	function treatTouchEventAsMouseEvent( ev ) {
		var dragger = this;
		var eventType = ev.type.slice( 0, 5 );
		
		// Get the cursor position. (Its origin is the left top of the whole page.)
		if ( eventType === 'touch' ) {
			var touch = ev.changedTouches[0];
			dragger.pageX = touch.pageX;
			dragger.pageY = touch.pageY;
			
			ev.preventDefault();  // to avoid firing the mousedown event
		}
		else if ( eventType === 'mouse' ) {
			dragger.pageX = ev.pageX;
			dragger.pageY = ev.pageY;
		}
	}
	
	function startDrag( onSetup, onStarted, ev ) {
		var dragger = this;
		treatTouchEventAsMouseEvent.call( dragger, ev );
		
		/*
		 * For mouse events, add listeners to the document element. (not to the dragged element)
		 * 
		 * Note: If drag fast on a desktop, the mouse cursor may go out of the dragged element.
		 * Besides, this enables them to respond to events triggered outside the browser window.
		 */
		document.addEventListener( "mousemove", dragger.listener.onMouseMove );
		document.addEventListener( "scroll",    dragger.listener.onScroll );
		document.addEventListener( 'mouseup',   dragger.listener.onMouseUp );
		
		/*
		 * Add listeners to the target element.
		 * 
		 * Note: Unlike desktops, even if drag fast on a mobile device, the dragged element
		 * wasn't left behind. But, if add listeners to the document, they also react to
		 * multi-touch. Therefore, dragging ends when another finger leaves from the screen.
		 */
		dragger.handle.el.addEventListener( "touchmove",   dragger.listener.onMouseMove, listenerOptions );
		dragger.handle.el.addEventListener( 'touchend',    dragger.listener.onMouseUp );
		dragger.handle.el.addEventListener( 'touchcancel', dragger.listener.onMouseUp );
		
		// Keep the size. (from the computed style to the inline style)
		dragger.follower.el.style.width  = dragger.follower.width  + 'px';
		dragger.follower.el.style.height = dragger.follower.height + 'px';
		
		// Calculate the clicked position in the coordinate within the dragged element.
		var rect = dragger.follower.el.getBoundingClientRect();
		dragger.itemX = dragger.pageX - window.pageXOffset - rect.left;
		dragger.itemY = dragger.pageY - window.pageYOffset - rect.top;
		
		// Save the current scrollX/Y to calculate the difference from the next scrollX/Y.
		dragger.scrollX = window.pageXOffset;
		dragger.scrollY = window.pageYOffset;
		
		// Find the element which creates the containing block of the dragged element.
		dragger.container = findContainer( dragger.follower );
		
		if ( onSetup ) onSetup( dragger );
		
		// Start to drag.
		dragger.follower.position = "absolute";
		var origin = dragger.container ? dragger.container.getPaddingBox() : { left: 0, top: 0 };
		dragger.follower.left = dragger.pageX - dragger.itemX - origin.left;
		dragger.follower.top  = dragger.pageY - dragger.itemY - origin.top;
		
		dragger.follower.el.classList.add( 'being-dragged' );
		
		if ( onStarted ) onStarted( dragger );
	}
	
	function drag( callback, ev ) {
		var dragger = this;
		treatTouchEventAsMouseEvent.call( dragger, ev );
		
		var origin = dragger.container ? dragger.container.getPaddingBox() : { left: 0, top: 0 };
		dragger.follower.left = dragger.pageX - dragger.itemX - origin.left;
		dragger.follower.top  = dragger.pageY - dragger.itemY - origin.top;
		
		if ( callback ) callback( dragger );
	}
	
	function endDrag( callback, ev ) {
		var dragger = this;
		
		document.removeEventListener( "mousemove", dragger.listener.onMouseMove );
		document.removeEventListener( "scroll",    dragger.listener.onScroll );
		document.removeEventListener( "mouseup" ,  dragger.listener.onMouseUp );
		dragger.handle.el.removeEventListener( "touchmove",   dragger.listener.onMouseMove );
		dragger.handle.el.removeEventListener( "touchend",    dragger.listener.onMouseUp );
		dragger.handle.el.removeEventListener( "touchcancel", dragger.listener.onMouseUp );
		
		// Remove the inline style.
		dragger.follower.position = '';
		dragger.follower.top  = '';
		dragger.follower.left = '';
		dragger.follower.width = '';
		dragger.follower.height = '';
		
		dragger.follower.el.classList.remove( 'being-dragged' );
		
		if ( callback ) callback( dragger );
	}
	
	function scroll( callback, ev ) {
		var dragger = this;
		
		var dX = window.pageXOffset - dragger.scrollX;
		var dY = window.pageYOffset - dragger.scrollY;
		
		// Save the current scrollX/Y to calculate the difference from the next scrollX/Y.
		dragger.scrollX = window.pageXOffset;
		dragger.scrollY = window.pageYOffset;
		
		/*
		 * Scroll the element.
		 * 
		 * Note: Inline style properties reduce the number of significant digits, so the
		 * dragged element may move slightly. Therefore, recalculate the position from
		 * the old pageX/Y instead of updating the old left/top.
		 */
		var origin = dragger.container ? dragger.container.getPaddingBox() : { left: 0, top: 0 };
		dragger.follower.left = dragger.pageX - dragger.itemX + dX - origin.left;
		dragger.follower.top  = dragger.pageY - dragger.itemY + dY - origin.top;
		
		// Update the cursor position.
		dragger.pageX += dX;
		dragger.pageY += dY;
		
		if ( callback ) callback( dragger );
	}
	
	
	/* ================================================================================ */
	/*   Private functions and variables   */
	
	/**
	 * Find the element which creates the containing block of the specified element.
	 * 
	 * @param {Element} elem 
	 */
	function findContainer( elem ) {
		var ancestor = wrap( elem.el.parentElement );
		
		while ( ancestor ) {
			
			// If the ancestor is a positioned element.
			if ( ancestor.position !== 'static' ) {
				break;
			}
			
			let style = ancestor.computedStyle;
			
			// Check the CSS properties.
			if (( style.filter      && style.filter      !== 'none' ) ||  // Safari on iOS11.2.1 doesn't work
				( style.perspective && style.perspective !== 'none' ) ||
				( style.transform   && style.transform   !== 'none' ) ||
				( style.contain === 'paint' ) ||  // IE11 doesn't work
				( style.willChange  && (  // Safari doesn't work with following 
					( style.willChange.indexOf( 'perspective' ) > -1 ) ||
					// ( style.willChange.indexOf( 'filter'      ) > -1 ) ||  // for Firefox
					( style.willChange.indexOf( 'transform'   ) > -1 ))))
			{
				break;
			}
			
			ancestor = wrap( ancestor.el.parentElement );
		}
		
		return ancestor;
	}
	
	/**
	 * Passive event listeners isn't used, but this is necessary to make Chrome DevTools silent.
	 * 
	 * Note: When a listener is added to touch and wheel events, the 'passive' option should be
	 * given to improve scrolling performance. (passive event listener)
	 * However, draggable.js cancels scrolling, so the passive option will have no effect.
	 */
	var listenerOptions = function() {
		
		// WORKAROUND: The passive option is not supported in old browsers such as IE11.
		var supported = false;
		try {
			var opts = Object.defineProperty( {}, 'passive', {
				get: function() {
					supported = true;
				}
			} );
			window.addEventListener( "testPassive", null, opts );
			window.removeEventListener( "testPassive", null, opts );
		} catch ( e ) {}
		
		return supported ? { passive: false } : false;
	}();
	
	
	/* ================================================================================ */
	/*   Publish to the global namespace   */
	
	var draggers = [];
	
	/**
	 * Enable the specified element to be dragged.
	 * 
	 * @param {Element}  follower        follows cursor on mousemove/touchmove events
	 * @param {Object}   opts            (optional)
	 * @param {Element}  opts.handle     listens for mousedown/touchstart events
	 * @param {Function} opts.onSetup    a callback function  @see startDrag()
	 * @param {Function} opts.onStarted  a callback function  @see startDrag()
	 * @param {Function} opts.onMove     a callback function  @see drag(),scroll()
	 * @param {Function} opts.onEnd      a callback function  @see endDrag()
	 */
	cp.ui.enableDrag = function( follower, opts ) {
		var dragger = new Dragger( follower, opts );
		
		draggers.push( dragger );
		dragger.enable();
		
		return dragger;
	}
	
	/**
	 * Disable the specified element to be dragged.
	 * 
	 * @param {Element} follower  the dragged element
	 */
	cp.ui.disableDrag = function( follower ) {
		for ( let i = 0; i < draggers.length; i++ ) {
			if ( draggers[i].follower.el === follower ) {
				draggers[i].disable(); 
				draggers.splice( i, 1 );
				break;
			}
		}
	}
	
} )( commonplace );
