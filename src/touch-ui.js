/**
 * TouchUI Core object
 *  - Singleton object
 * Fires the following events
 *  - tap
 *  - double-tap
 *  - triple-tap
 *  - hold
 *  - tap-and-hold
 *  - double-tap-and-hold
 *  - triple-tap-and-hold
 */
let touchUIInstance;

export default class TouchUI {

  constructor() {
    if (!touchUIInstance) {
      touchUIInstance = this;
      this.startPosEvent = null;  // position touch started
      this.startAt = null;   // time touch  started

      this.prevPosEvent = null;   // previous touch position when touch move
      this.endPosEvent = null;    // the current touch position

      this.lastTouchEventName = null; // name of last event. e.g. tap, double-tap
      this.lastTouchEventAt = null;   // time of last event

      this.lastMove = null;           // movement between the previous and current position
      this.holdHappened = false;      // true or false, indicates that hold happened or not

      this.tapTimer = null;           // tap expires after this time
      this.holdTimer = null;          // hold happens after his time

      this.dragEl = null;             // the element that currently dragging
      this.init();
    }
    return touchUIInstance;
  }

  // add global event listener
  init() {
    this.tapTimer = null;  // tap expires after this time
    this.holdTimer = null; // hold happens after his time

    // The following won't happen because it is a singleton
    let doc = document.body;

    doc.addEventListener(TouchUI.touchStart, this.touchStartHandler.bind(this), {passive: true});
    doc.addEventListener(TouchUI.touchMove,  this.touchMoveHandler.bind(this), {passive: true});
    doc.addEventListener(TouchUI.touchEnd,   this.touchEndHandler.bind(this), {passive: true});
    doc.addEventListener(TouchUI.touchLeave, this.touchResetHandler.bind(this), {passive: true});
  }

  touchStartHandler(e) {
    this.startPosEvent = e;
    this.startAt = (new Date()).getTime();
    this.holeHappened = false;

    clearTimeout(this.tapTimer);
    clearTimeout(this.holdTimer);
    this.holdTimer =  setTimeout(() => {
      let eventName =
        this.lastTouchEventName === 'tap' ? 'tap-and-hold' :
        this.lastTouchEventName === 'double-tap' ? 'double-tap-and-hold' : 'hold';

      TouchUI.fireTouchEvent(e.target, eventName, e);
      this.lastTouchEventName = eventName;
      this.holdHappened = true;
      clearTimeout(this.holdTimer);
    }, TouchUI.HOLD_TIME);
    this.prevPosEvent = this.startPosEvent;
  }

  touchMoveHandler(e) {
    this.endPosEvent = e;
    this.lastMove = TouchUI.calcMove(this.prevPosEvent, this.endPosEvent);
    if (this.getMove().length > TouchUI.SMALL_MOVE) { // not a small movement
      clearTimeout(this.holdTimer);
      clearTimeout(this.tapTimer);
    }
    this.prevPosEvent = this.endPosEvent;
  }

  touchEndHandler(e) {
    this.endPosEvent = e;
    if (this.getMove().length < TouchUI.SMALL_MOVE) { // if little moved
      let eventName =
        this.lastTouchEventName === 'tap' ? 'double-tap' :
        this.lastTouchEventName === 'double-tap' ? 'triple-tap' : 'tap';

      TouchUI.fireTouchEvent(e.target, eventName, e);
      this.lastTouchEventName = eventName;
    }
    this.touchResetHandler();
  }

  touchResetHandler(e) {
    this.startPosEvent = null;
    this.startAt = null;
    this.prevPosEvent = null;
    this.endPosEvent = null;
    this.lastMove = null;
    this.holdHappened = false;
    clearTimeout(this.holdTimer);
    // this.lastTouchEventName = null;  // Don't do this. will be done by timer
    // this.lastTouchEventAt = null;    // Don't do this. will be done by timer
    // To catch continuous actoins, e.g., double-tap
    this.tapTimer = setTimeout(() => {
      this.lastTouchEventName = null;
      this.lastTouchEventAt = null;
    }, TouchUI.LAST_EVENT_RESET_TIME);
  }

  getMove() {
    return TouchUI.calcMove(this.startPosEvent, this.endPosEvent);
  }

}

TouchUI.isTouch = function () {
  return  ('ontouchstart' in window) ||
   (navigator.MaxTouchPoints > 0) ||
   (navigator.msMaxTouchPoints > 0);
};

TouchUI.SMALL_MOVE = 10;    // small movement; default 10px
TouchUI.HOLD_TIME  = 100;   // time in milliseconds that hold event fires, default 100ms
TouchUI.LAST_EVENT_RESET_TIME = 300; // time in milliseconds that the last event should be remembered. default 200ms

TouchUI.touchStart = TouchUI.isTouch() ? 'touchstart' : 'mousedown';
TouchUI.touchMove  = TouchUI.isTouch() ? 'touchmove'  : 'mousemove';
TouchUI.touchEnd   = TouchUI.isTouch() ? 'touchend'   : 'mouseup';
TouchUI.touchLeave = TouchUI.isTouch() ? 'touchleave' : 'mouseleave';
TouchUI.touchEnter = TouchUI.isTouch() ? 'touchenter' : 'mouseenter';

TouchUI.fireTouchEvent = function (el, eventName, orgEvent, eventData) {
  let customEvent;

  if (orgEvent.button) { // e.button  left 0, middle 1, right 2
    return false;
  }

  customEvent = new CustomEvent(eventName, orgEvent);

  for (let key in (eventData || {})) {
    customEvent[key] = eventData[key];
  }

  customEvent.eventName = eventName;
  if (orgEvent.clientX) {
    customEvent.button  = orgEvent.button;
    customEvent.which   = orgEvent.which;
    customEvent.clientX = orgEvent.clientX;
    customEvent.clientY = orgEvent.clientY;
    customEvent.pageX   = orgEvent.pageX;
    customEvent.pageY   = orgEvent.pageY;
    customEvent.screenX = orgEvent.screenX;
    customEvent.screenY = orgEvent.screenY;
  }
  orgEvent.touches && (customEvent.touches = orgEvent.touches);
  orgEvent.changedTouches && (customEvent.changedTouches = orgEvent.changedTouches);
  orgEvent.targetTouches && (customEvent.targetTouches = orgEvent.targetTouches);

  el.dispatchEvent(customEvent);

  // orgEvent.preventDefault();
  return customEvent;
};

TouchUI.getStyle = function (elem, prop) {
  let style;

  if (elem.currentStyle) {
    style = elem.currentStyle[prop];
  } else if (window.getComputedStyle) {
    style = window.getComputedStyle(elem, null)[prop];
  }
  return style;
};

TouchUI.getOverlappingEl = function (inEl, outEls) {
  let rect1 = inEl.getBoundingClientRect(), rect2, overlap;
  let ret;

  for (let i = 0; i < outEls.length; i++) {
    rect2 = outEls[i].getBoundingClientRect();
    overlap = !(
      rect1.right < rect2.left ||  rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||  rect1.top > rect2.bottom
    );
    if (overlap) {
      ret = outEls[i];
      break;
    }
  }
  return ret;
};

TouchUI.disableDefaultTouchBehaviour = function (el) {
  el.style.webkitTouchCallout = 'none';
  el.style.webkitUserSelect = 'none';
  el.style.mozUserSelect = 'none';
  el.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
  return el;
};

TouchUI.calcMove = function (startPosEvent, endPosEvent) {
  let move = { x: 0, y: 0, length: 0, direction: null };
  let staPos, endPos, startX, startY, endX, endY, moveX, moveY;

  if (startPosEvent && endPosEvent) {
    staPos = startPosEvent.touches && startPosEvent.touches[0] ? startPosEvent.touches[0] :
             startPosEvent.changedTouches && startPosEvent.changedTouches[0] ? startPosEvent.changedTouches[0] :
             startPosEvent;
    endPos = endPosEvent.touches && endPosEvent.touches[0] ? endPosEvent.touches[0] :
             endPosEvent.changedTouches && endPosEvent.changedTouches[0] ? endPosEvent.changedTouches[0] :
             endPosEvent;

    [startX, startY] = [staPos.clientX, staPos.clientY];
    [endX, endY]     = [endPos.clientX, endPos.clientY];

    [move.x, move.y] = [endX - startX, endY - startY];
    [moveX, moveY]   = [Math.abs(move.x), Math.abs(move.y)];
    move.direction =
      (moveX >  moveY) && (startX >  endX) ? 'left' :
      (moveX >  moveY) && (startX <= endX) ? 'right' :
      (moveX <= moveY) && (startY >  endY) ? 'up' :
      (moveX <= moveY) && (startY <= endY) ? 'down' : null;
    move.length = Math.floor(Math.sqrt(Math.pow(move.x, 2) + Math.pow(move.y, 2)));
  }
  return move;
};

TouchUI.parseArguments = function (args, options = {}) { // args is an array, Array.from(arguments), not arguments
  let parsed = {elements: [], options: options};

  args.forEach(arg => {
    if (Array.isArray(arg)) {
      parsed.elements = parsed.elements.concat(arg);
    } else if (arg instanceof HTMLElement) {
      parsed.elements.push(arg);
    } else if (typeof arg === 'object') {
      for (let key in arg) {
        parsed.options[key] = arg[key];
      }
    }
  });
  return parsed;
};

TouchUI.getOverlappingEl = function (el, candidates) {
  let rect1 = el.getBoundingClientRect(), rect2, overlap;
  let ret;

  for (let i = 0; i < candidates.length; i++) {
    rect2 = candidates[i].getBoundingClientRect();
    overlap = !(
      rect1.right < rect2.left ||  rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||  rect1.top > rect2.bottom
    );
    if (overlap) {
      ret = candidates[i];
      break;
    }
  }
  return ret;
};
