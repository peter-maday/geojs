//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, */
/*jslint white: true, indent: 2, continue:true*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document, gl, vec3*/
//////////////////////////////////////////////////////////////////////////////

geo.floodLayer = function() {
  "use strict";
  if (!(this instanceof geo.floodLayer)) {
    return new geo.floodLayer();
  }

  /** @private */
  var m_super = callSuper(geo.featureLayer, this),
      m_that = this;

  this.addData = function(data, append, pointSize) {
    var i, features;

    append = typeof append !== 'undefined' ? append : false;

    m_super.addData.call(this, data, append);

    // Now set the point size

    if (typeof pointSize !== 'undefined') {
      this.setPointSpriteSize(pointSize);
    }
  };

  this.setPointSpriteSize = function(pointSize) {
    var i, features = this.features();
    for(i=0; i< features.length; i++) {
      features[0].material().shaderProgram().uniform("pointSize").set(pointSize)
    }
  };
};

inherit(geo.floodLayer, geo.featureLayer);
