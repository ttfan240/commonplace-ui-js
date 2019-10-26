/**
 * Utility functions
 */

var commonplace = {};


( function( cp ) {
	function WrappedElement( el ) {
		this.el = el;
		this.computedStyle = getComputedStyle( el );
	}
	fn = WrappedElement.prototype;
	
	/* ================================================================================ */
	/*   Define getters and setters for CSS properties   */
	
	/**
	 *  CSS properties specified in pixels.
	 */
	var pxProps = [
		// 'height', 'width',  // WORKAROUND: disable to avoid ie11 bug
		'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
		'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth',
		'top', 'left'
	];
	for ( let i = pxProps.length; i--; ) {
		let prop = pxProps[i];
		Object.defineProperty( fn, prop, {
			get: function() {
				return parseFloat( this.computedStyle[prop] );
			},
			set: function( value ) {
				this.el.style[prop] = ( value || value === 0 ) ? value + 'px' : '';
			},
			enumerable: false,
			configurable: true
		} );
	}
	
	/**
	 * CSS properties about size.
	 * 
	 * WORKAROUND: 
	 * `getComputedStyle()` returns a wrong value in IE11. Even if `box-sizing` is set to
	 * `border-box`, it returns the size not including the padding size. Therefore, use 
	 * `getBoundingClientRect()` instead.
	 */
	var sizeProps = [
		'height', 'width'
	];
	for ( let i = sizeProps.length; i--; ) {
		let prop = sizeProps[i];
		Object.defineProperty( fn, prop, {
			get: function() {
				var style = this.computedStyle;
				
				/*
				 * Calculate the size including the border width.
				 * (This value is proper when `box-sizing` is `border-box`.)
				 */
				var value = this.el.getBoundingClientRect()[prop];
				
				// If `box-sizing` is `content-box`, subtract the border width.
				if ( style.boxSizing === 'content-box' ) {
					if ( prop === 'width' ) {
						value -= this.borderLeftWidth + this.borderRightWidth;
					} else {
						value -= this.borderTopWidth + this.borderBottomWidth;
					}
				}
				return value;
			},
			set: function( value ) {
				this.el.style[prop] = ( value || value === 0 ) ? value + 'px' : '';
			},
			enumerable: false,
			configurable: true
		} );
	}
	
	/**
	 *  CSS properties specified by keywords.
	 */
	var keyProps = [
		'position'
	];
	for ( let i = keyProps.length; i--; ) {
		let prop = keyProps[i];
		Object.defineProperty( fn, prop, {
			get: function() {
				return this.computedStyle[prop];
			},
			set: function( value ) {
				this.el.style[prop] = value;
			},
			enumerable: false,
			configurable: true
		} );
	}
	
	/**
	 *  CSS properties specified by number.
	 */
	var numProps = [
		'zIndex'
	];
	for ( let i = numProps.length; i--; ) {
		let prop = numProps[i];
		Object.defineProperty( fn, prop, {
			get: function() {
				return this.el.style[prop];
			},
			set: function( value ) {
				this.el.style[prop] = value;
			},
			enumerable: false,
			configurable: true
		} );
	}
	
	
	/* ================================================================================ */
	/*   Define properties   */
	
	Object.defineProperty( fn, 'index', {
		get: function() {
			var elem = this.el;
			for ( var i = 0; elem.previousElementSibling; i++ ) {
				elem = elem.previousElementSibling;
			}
			return i;
		},
		enumerable: false,
		configurable: true
	} );
	
	
	/* ================================================================================ */
	/*   Define methods   */
	
	/**
	 * Get the rectangle bounded by the padding edge, which is composed of
	 * the content area and the padding area.
	 * (Its properties indicate the position from the left top of the whole page.)
	 */
	fn.getPaddingBox = function() {
		var clientRect = this.el.getBoundingClientRect();
		
		var rect = {
			left:   clientRect.left   + this.borderLeftWidth   + window.pageXOffset,
			top:    clientRect.top    + this.borderTopWidth    + window.pageYOffset,
			right:  clientRect.right  - this.borderRightWidth  + window.pageXOffset,
			bottom: clientRect.bottom - this.borderBottomWidth + window.pageYOffset,
		};
		
		return rect;
	}
	
	
	/* ================================================================================ */
	/*   Publish to global namespace   */
	
	/**
	 * Wrap the given element.
	 * 
	 * @param {Element} el  the wrapped element
	 */
	cp.wrapElement = function( el ) {
		if ( ! el ) {
			return null;
		}
		
		return new WrappedElement( el );
	}
} )( commonplace );
