//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of mapInteractorStyle
 *
 * @class geo.mapInteractorStyle
 * @returns {geo.mapInteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.mapInteractorStyle = function () {
  "use strict";
  if (!(this instanceof ggl.mapInteractorStyle)) {
    return new ggl.mapInteractorStyle();
  }
  geo.interactorStyle.call(this);
  var m_map,
    m_this = this,
    m_leftMouseButtonDown = false,
    m_rightMouseButtonDown = false,
    m_middileMouseButtonDown = false,
    m_initRightBtnMouseDown = false,
    m_regionSelectionMode = false,
    m_regionSelectionLayer,
    m_regionSelectionPlane,
    m_clickLatLng,
    m_width,
    m_height,
    m_renderer,
    m_renderWindow,
    m_camera,
    m_outsideCanvas,
    m_currentMousePos,
    m_focusDisplayPoint,
    m_zTrans,
    m_coords,
    m_mouseLastPos = { x: 0, y: 0 },
    m_picker = new vgl.picker(),
    m_viewer = null,
    m_updateRenderParamsTime = vgl.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets map for this interactor, adds draw region layer if needed
   *
   * @param {geo.map} newMap optional
   * @returns {geo.mapInteractorStyle|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function (val) {
    if (val !== undefined) {
      m_map = val;

      return m_this;
    }
    return m_map;
  };

////////////////////////////////////////////////////////////////////////////
  /**
   * Return viewer referenced by the interactor style
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewer = function() {
    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set viewer for the interactor style
   *
   * @param viewer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewer = function(viewer) {
    if (viewer !== m_viewer) {
      m_viewer = viewer;
      $(m_viewer).on(vgl.event.mousePress, m_this.handleMouseDown);
      $(m_viewer).on(vgl.event.mouseRelease, m_this.handleMouseUp);
      $(m_viewer).on(vgl.event.mouseMove, m_this.handleMouseMove);
      $(m_viewer).on(vgl.event.mouseOut, m_this.handleMouseOut);
      $(m_viewer).on(vgl.event.mouseWheel, m_this.handleMouseWheel);
      $(m_viewer).on(vgl.event.keyPress, m_this.handleKeyPress);
      $(m_viewer).on(vgl.event.mouseContextMenu, m_this.handleContextMenu);
      $(m_viewer).on(vgl.event.click, m_this.handleClick);
      $(m_viewer).on(vgl.event.dblClick, m_this.handleDoubleClick);
      m_this.modified();
    }
  };



  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets selectRegion for this interactor
   *
   * @param {Boolean} newValue optional
   * @returns {geo.mapInteractorStyle|Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.selectRegion = function (val) {
    if (val !== undefined) {
      m_regionSelectionMode = val;
      if (!m_regionSelectionMode) {
        m_regionSelectionLayer.deleteFeature(m_regionSelectionPlane);
      }
      m_map.draw();
      return m_this;
    }
    return m_regionSelectionMode;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to pan a camera associated with a renderer.
   *
   * @param {vgl.renderer} the renderer whose camera should be panned.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._panCamera = function (renderer) {
    var worldPt1, worldPt2, dx, dy, dz, focusDisplayPoint = renderer.focusDisplayPoint();

    worldPt1 = m_renderWindow.displayToWorld(m_currentMousePos.x,
      m_currentMousePos.y, focusDisplayPoint, renderer);
    worldPt2 = m_renderWindow.displayToWorld(m_mouseLastPos.x,
      m_mouseLastPos.y, focusDisplayPoint, renderer);

    dx = worldPt1[0] - worldPt2[0];
    dy = worldPt1[1] - worldPt2[1];
    dz = worldPt1[2] - worldPt2[2];

    renderer.camera().pan(-dx, -dy, -dz);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear region selection for this interactor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clearRegionSelection = function()  {

    if (m_regionSelectionLayer) {
      m_regionSelectionLayer.deleteFeature(m_regionSelectionPlane);
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function (event) {
    /// Local vars
    var mouseWorldPoint,
        lastWorldPos,
        currWorldPos,
        evt,
        i,
        renderers;

    /// Update render params
    m_this.updateRenderParams();

    /// Compute current mouse position
    m_this._computeCurrentMousePos(event);

    if (m_outsideCanvas === true) {
      return true; // allow bubbling up the event
    }
    if (m_leftMouseButtonDown) {
      if(m_regionSelectionMode) {
        mouseWorldPoint = m_map.displayToGcs(m_currentMousePos);
        m_this._setDrawRegion(m_clickLatLng.lat(), m_clickLatLng.lng(),
          mouseWorldPoint.y, mouseWorldPoint.x);
      } else {
        lastWorldPos = m_camera.position();
        // Pan all cameras associated with the render window.
        renderers = m_renderWindow.renderers();
        for (i = 0; i < renderers.length; i += 1) {
          m_this._panCamera(renderers[i]);
        }
        currWorldPos = m_camera.position();

        // TODO Do we need to emit an event for each ?
        evt = {type: geo.event.pan,
               last_display_pos: m_mouseLastPos,
               curr_display_pos: m_currentMousePos,
               last_world_pos: lastWorldPos,
               curr_world_pos: currWorldPos};

        $(m_this).trigger(evt);
      }
    }
    if (m_middileMouseButtonDown) {
      /// DO NOTHING AS OF NOW
    }
    if (m_rightMouseButtonDown && m_height > 0) {
      /// 2.0 is sort of speed up factor
      m_zTrans = 2.0 * (m_currentMousePos.y - m_mouseLastPos.y) / m_height;
      m_this.zoom();

      /// For now just trigger the render. Later on, we may want to
      /// trigger an external event
      // m_renderWindow.render();
    }

    m_mouseLastPos.x = m_currentMousePos.x;
    m_mouseLastPos.y = m_currentMousePos.y;
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function (event) {
    var point;

    /// Update render parameters
    m_this.updateRenderParams();

    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = true;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = true;
    }

    m_coords = m_this.viewer().relMouseCoords(event);
    if (m_coords.x < 0) {
      m_mouseLastPos.x = 0;
    } else {
      m_mouseLastPos.x = m_coords.x;
    }
    if (m_coords.y < 0) {
      m_mouseLastPos.y = 0;
    } else {
      m_mouseLastPos.y = m_coords.y;
    }

    if(m_regionSelectionMode && m_leftMouseButtonDown) {
      point = m_map.displayToGcs(m_mouseLastPos);
      m_clickLatLng = geo.latlng(point.y, point.x);
      m_this._setDrawRegion(point.y, point.x, point.y, point.x);
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @NOTE We never get mouse up from scroll bar: See the bug report here
   * http://bugs.jquery.com/ticket/8184
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function (event) {
    var width = null,
        height = null,
        num = null,
        coords,
        regionSelectEvent;

    /// Update render params
    m_this.updateRenderParams();

    if (event.button === 0) {
      m_leftMouseButtonDown = false;
      width = m_this.viewer().renderWindow().windowSize()[0];
      height = m_this.viewer().renderWindow().windowSize()[1];
      m_renderer = m_this.viewer().renderWindow().activeRenderer();
      if (m_mouseLastPos.x >= 0 && m_mouseLastPos.x <= width &&
          m_mouseLastPos.y >= 0 && m_mouseLastPos.y <= height) {
        num = m_picker.pick(m_mouseLastPos.x, m_mouseLastPos.y, m_renderer);

        if (m_regionSelectionMode) {
          regionSelectEvent = jQuery.Event(geo.event.regionSelect);
          coords = m_regionSelectionPlane.coords();
          regionSelectEvent.origin = coords[0];
          regionSelectEvent.upperLeft = coords[1];
          regionSelectEvent.lowerRight = coords[2];
          $(m_this).trigger(geo.event.regionSelect, regionSelectEvent);
        }
      }
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
      m_initRightBtnMouseDown = false;

      /// Now zoom
      m_this.zoom();
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when mouse goes out of canvas
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseOut = function () {
    /// Update render params
    m_this.updateRenderParams();

    if (m_leftMouseButtonDown) {
      m_leftMouseButtonDown = false;
    } else if (m_middileMouseButtonDown) {
      m_middileMouseButtonDown = false;
    }
    if (m_rightMouseButtonDown) {
      m_rightMouseButtonDown = false;
      m_initRightBtnMouseDown = false;

      /// Perform zoom when the mouse goes out of canvas as we
      /// are treating mouse out as right button up.
      m_this.zoom();
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseWheel = function (event) {
    /// Update render params
    m_this.updateRenderParams();

    var delta = event.originalEvent.wheelDeltaY / 120.0;
    delta = Math.pow(1 + Math.abs(delta) / 2, delta > 0 ? -1 : 1);

    /// Compute current mouse position
    m_this._computeCurrentMousePos(event);

    m_this.zoom(delta);
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to zoom cameras
   * @param {Number} optional value to zoom by
   */
  ////////////////////////////////////////////////////////////////////////////
  this._syncZoom = function (val) {
    var i, renderers, pos, fp, cam;

    /// Make sure we are uptodate with renderer and render window
    m_this.updateRenderParams();

    if (val) {
      m_camera.zoom(val);
      m_renderer.resetCameraClippingRange();
    }

    pos = m_camera.position();
    fp = m_camera.focalPoint();

    renderers = m_renderWindow.renderers();
    for (i = 0; i < renderers.length; i += 1) {
      cam = renderers[i].camera();
      if (cam !== m_camera) {
        cam.setPosition(pos[0], pos[1], pos[2]);
        cam.setFocalPoint(fp[0], fp[1], fp[2]);
        renderers[i].resetCameraClippingRange();
        renderers[i].render();
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to zoom cameras
   * @param {Number} optional value to zoom by
   */
  ////////////////////////////////////////////////////////////////////////////
  this._syncReset = function (resetAll) {
    var i, renderers, pos, fp, zoom, center, cam, clippingRange;

    /// Make sure we are uptodate with renderer and render window
    m_this.updateRenderParams();

    zoom = m_map.zoom();
    center = m_map.center();
    fp = m_camera.focalPoint();

    /// TODO: Call base layer - reference layer
    center = m_map.baseLayer().toLocal(geo.latlng(center[0], center[1]));

    if (resetAll &&
        center instanceof Object &&
        "x" in center &&
        "y" in center &&
        m_map.baseLayer() instanceof geo.osmLayer) {

      m_camera.setPosition(center.x, center.y, computeCameraDistance(zoom));
      m_camera.setFocalPoint(center.x, center.y, fp[2]);
      m_renderer.resetCameraClippingRange();
    }

    fp = m_camera.focalPoint();
    pos = m_camera.position();
    clippingRange = m_camera.clippingRange();

    renderers = m_renderWindow.renderers();

    /// TODO Check if we are allowed to transfrom the camera for this renderer
    for (i = 0; i < renderers.length; i += 1) {
      cam = renderers[i].camera();
      if (cam !== m_camera) {
        cam.setPosition(pos[0], pos[1], pos[2]);
        cam.setFocalPoint(fp[0], fp[1], fp[2]);
        cam.setClippingRange(clippingRange[0], clippingRange[1]);
        renderers[i].render();
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to zoom cameras
   * @param {Number} optional value to zoom by
   */
  ////////////////////////////////////////////////////////////////////////////
  this._syncPan = function () {
    /// TODO: Implement this
    // var i, renderers;
    // m_camera.zoom(val);
    // m_renderer.resetCameraClippingRange();

    // renderers = m_renderWindow.renderers();
    // for (i = 0; i < renderers.length; i++) {
    //   if (renderers[i].camera() !== m_camera) {
    //     renderers[i].camera().zoom(val);
    //     renderers[i].resetCameraClippingRange();
    //   }
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update view in response to a zoom request
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function (val) {
    var evt,
        newZoomLevel,
        oldZoomLevel,
        pos = m_camera.position();

    /// Update render params
    m_this.updateRenderParams();

    m_zTrans = (m_currentMousePos.y - m_mouseLastPos.y) / m_height;

    if (val === undefined) {
      if (m_zTrans < 0) {
        val = 1 - Math.abs(m_zTrans);
      } else {
        val = 1 + Math.abs(m_zTrans);
      }
    }

    oldZoomLevel = computeZoomLevel();

    if (pos[2] * Math.sin(m_camera.viewAngle()) >= 360.0 && val > 1) {
      m_camera.setPosition(pos[0], pos[1], computeCameraDistance(0));
      m_renderer.resetCameraClippingRange();

      /// We are forcing the minimum zoom level to 2 so that we can get
      /// high res imagery even at the zoom level 0 distance
      newZoomLevel = 0;
    } else {
      this._syncZoom(val);

      /// Compute meters per pixel here and based on that decide the
      /// zoom level
      newZoomLevel = computeZoomLevel();
    }

    /// Check again here:
    pos = m_camera.position();
    if (pos[2] * Math.sin(m_camera.viewAngle()) >= 360.0 && val > 1) {
      m_camera.setPosition(pos[0], pos[1], computeCameraDistance(0));
      m_renderer.resetCameraClippingRange();

      /// We are forcing the minimum zoom level to 2 so that we can get
      /// high res imagery even at the zoom level 0 distance
      newZoomLevel = 0;

      /// Sync all other camera again.
      this._syncZoom();
    }

    evt = { type: geo.event.zoom,
            curr_zoom: newZoomLevel,
            last_zoom: oldZoomLevel };
    $(m_this).trigger(evt);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets the lastMousePosition for this interactor
   *
   * @param newPosition optional
   * @param {Number} newPosition.x
   * @param {Number} newPosition.y
   * @returns {geo.mapInteractorStyle|Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lastMousePosition = function (newPosition) {
    if (newPosition !== undefined) {
      m_mouseLastPos = newPosition;
      return m_this;
    }
    return m_mouseLastPos;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets leftMouseDown for this interactor
   *
   * @param {Boolean} newValue optional
   * @returns {geo.mapInteractorStyle|Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.leftMouseDown = function (newValue) {
    if (newValue !== undefined) {
      m_leftMouseButtonDown = newValue;
      return m_this;
    }
    return m_leftMouseButtonDown;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets the draw region coordinates for this interactor
   *
   * @param {Number} lat1
   * @param {Number} lon1
   * @param {Number} lat2
   * @param {Number} lon2
   * @returns {geo.mapInteractorStyle}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._setDrawRegion = function (lat1, lon1, lat2, lon2) {

    //m_drawRegionLayer.renderer().contextRenderer().setLayer(1);

    if (!m_regionSelectionLayer) {
      m_regionSelectionLayer = m_map.createLayer('feature', {
        "opacity": 0.5,
        "showAttribution": 1
      });
    }

    if (m_regionSelectionPlane) {
      m_regionSelectionLayer.deleteFeature(m_regionSelectionPlane);
    }

    m_regionSelectionPlane = m_regionSelectionLayer.createFeature('plane')
                      .origin(geo.latlng(lat1, lon2))
                      .upperLeft(geo.latlng(lat1, lon1))
                      .lowerRight(geo.latlng(lat2, lon2))
                      .bin(2000);


    m_regionSelectionPlane._update();
    m_regionSelectionLayer._draw();

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute current mouse position
   *
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._computeCurrentMousePos = function (event) {
    /// Update render params
    m_this.updateRenderParams();

    m_outsideCanvas = false;
    m_coords = m_this.viewer().relMouseCoords(event);
    m_currentMousePos = {
      x: 0,
      y: 0
    };
    if ((m_coords.x < 0) || (m_coords.x > m_width)) { // off-by-one error
      m_currentMousePos.x = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.x = m_coords.x;
    }
    if ((m_coords.y < 0) || (m_coords.y > m_height)) { // off-by-one error
      m_currentMousePos.y = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.y = m_coords.y;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute current mouse position
   *
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateRenderParams = function () {
    m_renderWindow = m_this.viewer().renderWindow();
    m_width = m_renderWindow.windowSize()[0];
    m_height = m_renderWindow.windowSize()[1];
    m_renderer = m_this.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();
    m_focusDisplayPoint = m_renderWindow.focusDisplayPoint();
    m_updateRenderParamsTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset to default
   */
  ////////////////////////////////////////////////////////////////////////////
  this.reset = function (resetAll) {
    var evt, zoom;

    if (!m_map) {
      return;
    }

    zoom = m_map.zoom();

    m_this._syncReset(resetAll);

    evt = { type: geo.event.zoom,
            curr_zoom: zoom,
            last_zoom: zoom };
    $(m_this).trigger(evt);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute zoom level
   *
   * @param deltaMerc mercator/per pixel
   * @returns {Number} zoom level
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function computeZoomLevel() {
    var i, pos = m_camera.position(),
        width = (pos[2] * Math.sin(m_camera.viewAngle()));
    for (i = 0; i < 20; i += 1) {
      if (width >= (360.0 / Math.pow(2, i))) {
        /// We are forcing the minimum zoom level to 2 so that we can get
        /// high res imagery even at the zoom level 0 distance
        return i;
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute camera distance for a given zoom level
   *
   * @returns {Number} camera distance from the map
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function computeCameraDistance(zoomLevel) {
    var deg = 360.0 / Math.pow(2, zoomLevel);
    return (deg / Math.sin(m_camera.viewAngle()));
  }

  return this;
};

inherit(ggl.mapInteractorStyle, geo.interactorStyle);
