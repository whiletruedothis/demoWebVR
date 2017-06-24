class DemoVR extends Demo {
	constructor() {
    super();

    this._getDisplay = this._getDisplay.bind(this);
    this._togglePresent = this._togglePresent.bind(this);
    this._button = document.getElementById('vr-button');
    this._button.addEventListener('click', this._togglePresent);
    this._button.style.display = '';
    this._presentChanged = this._presentChanged.bind(this);
    this._frameData = new VRFrameData();
    window.addEventListener('vrdisplaypresentchange', this._presentChanged);


    // If a display is connected or disconnected then we need to check that we
    // are still using a valid display
    window.addEventListener('vrdisplayconnect', this._getDisplay);
    window.addEventListener('vrdisplaydisconnect', this._getDisplay);

    this._display = null;

    this._getDisplay();
  }

  // Choose the first available VR display
  _getDisplay() {
    navigator.getVRDisplays().then((displays) => {
      displays = displays.filter(display => display.capabilities.canPresent);
      if (displays.length === 0) {
        this._display = null;
      } else {
        this._display = displays[0];
      }
      console.log(`Current display: ${this._display}`);
    });
  }


  _togglePresent() {
  if (this._display) {
    if (this._display.isPresenting) {
      this._deactivateVR();
    } else {
      this._activateVR();
    }
  }  
}

_activateVR() {
  if (this._display && !this._display.isPresenting) {
    this._display.requestPresent([{
      source: this._renderer.domElement
    }]);
  }
}

_deactivateVR() {
  if (this._display && this._display.isPresenting) {
    this._display.exitPresent();
  }
}

_presentChanged() {
  if (this._display && this._display.isPresenting) {
    this._button.textContent = 'Exit VR';      
  } else {
    this._button.textContent = 'Enable VR';
  }
}

_onResize() {
  if (!this._display || !this._display.isPresenting) {
    return super._onResize();
  }

  const leftEye = this._display.getEyeParameters('left');
  const rightEye = this._display.getEyeParameters('right');

  this._width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
  this._height = Math.max(leftEye.renderHeight, rightEye.renderHeight);

  this._renderer.setSize(this._width, this._height, false);
}

_presentChanged() {
  if (this._display && this._display.isPresenting) {
    this._button.textContent = 'Exit VR';
    this._renderer.autoClear = false;
    this._display.depthNear = this._camera.near;
    this._display.depthFar = this._camera.far;
    this._camera.matrixAutoUpdate = false;
  } else {
    this._button.textContent = 'Enable VR';
    this._renderer.autoClear = true;
    this._camera.matrixAutoUpdate = true;
  }

  this._onResize();
}

_render() {
  // If we aren't presenting to a display then do the non-VR render
  if (!this._display || !this._display.isPresenting) {
    return super._render();
  }

  // Clear the canvas manually.
  this._renderer.clear();

  // Left eye.
  this._renderEye(0);

  // Ensure that left eye calcs aren't going to interfere with right eye ones.
  this._renderer.clearDepth();

  // Right eye.
  this._renderEye(this._width / 2);

  this._display.requestAnimationFrame(this._update);
}

_renderEye(x) {
  this._renderer.setViewport(x, 0, this._width / 2, this._height);
  this._renderer.render(this._scene, this._camera);
}

_updateCamera(viewMatrix, projectionMatrix) {
  this._camera.projectionMatrix.fromArray(projectionMatrix);
  this._camera.matrix.fromArray(viewMatrix);
  this._camera.matrix.getInverse(this._camera.matrix);
  this._camera.updateMatrixWorld(true);
}


_render() {
  // If we aren't presenting to a display then do the non-VR render
  if (!this._display || !this._display.isPresenting) {
    return super._render();
  }

  this._display.getFrameData(this._frameData);

  // Clear the canvas manually.
  this._renderer.clear();

  // Left eye.
  this._updateCamera(this._frameData.leftViewMatrix, this._frameData.leftProjectionMatrix);
  this._renderEye(0);

  // Ensure that left eye calcs aren't going to interfere with right eye ones.
  this._renderer.clearDepth();

  // Right eye.
  this._updateCamera(this._frameData.rightViewMatrix, this._frameData.rightProjectionMatrix);
  this._renderEye(this._width / 2);

  this._display.submitFrame();
  this._display.requestAnimationFrame(this._update);
}

}