/**
 * Functions used only for development
 */

( function () {
	'use strict';
	
	var time = function () {};
	time.toString = function getTime() {
		var now = new Date();
		
		// var template = '[YYYYMMDD hh:mm:ss]';
		var template = '[hh:mm:ss]';
		template = template.replace( 'YYYY', now.getFullYear() );
		template = template.replace( 'MM', fillZero( now.getMonth() + 1 ) );
		template = template.replace( 'DD', fillZero( now.getDate()      ) );
		template = template.replace( 'hh', fillZero( now.getHours()     ) );
		template = template.replace( 'mm', fillZero( now.getMinutes()   ) );
		template = template.replace( 'ss', fillZero( now.getSeconds()   ) );
		
		return template;
	}
	
	function fillZero( num ) {
		return ( num < 10 ) ? ( '0' + num ) : ( num.toString() );
	}
	
	window.log   = console.log.bind(   console, '%s', time );
	window.trace = console.trace.bind( console, '%s', time );
	window.warn  = console.warn.bind(  console, '%s', time, 'WARNING:' );
	window.error = console.error.bind( console, '%s', time, 'ERROR:' );
	
} )();
