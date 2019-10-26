
(function(cp) {

	/**
	 * Display the position of each element.
	 */
	function displayPosition() {
		var targets = document.getElementsByClassName('draggable');
		var monitors = document.getElementsByClassName('monitor');
		
		for (let i = 0; i < targets.length; i++) {
			let rect = targets[i].getBoundingClientRect();
			let left = rect.left + window.pageXOffset;
			let top  = rect.top  + window.pageYOffset;
			let text = '{left: ' + left + ', top: ' + top + '}';
			
			monitors[i].textContent = text;
		}
	};
	displayPosition();
	
	elems = document.getElementsByClassName('draggable');
	for (let i = 0; i < elems.length; i++) {
		cp.ui.enableDrag(elems[i], {
			onSetup: displayPosition,
			onStarted: displayPosition,
			onMove: displayPosition,
			onEnd: displayPosition
		});
	}
	
})(commonplace);
