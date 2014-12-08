var scene;
var camera;
var renderer;

var raycaster = new THREE.Raycaster();
var vector = new THREE.Vector3();
var brush; // UI element


var onMouseDownPosition = new THREE.Vector2();
var radious = 600;
var theta = 90;
var onMouseDownTheta = 90;
var phi = 90;
var onMouseDownPhi = 90;
var isMouseDown = false;
var isShiftDown = false;

var origin; 
var base = [];
var fractal = {};

var divisor = 3;
var cubeSize = 64;
var miniCubeSize = cubeSize/divisor;
var cubeColor = Math.random() * 0xffffff;
var cubeMat = new THREE.MeshLambertMaterial( { color: cubeColor } );

var middle = new THREE.Vector3( 40.5 , 0, 40.5 );
 
init();
animate();

function init() {
  setUpScene();

  // Create a renderer and add it to the DOM.
  renderer = new THREE.WebGLRenderer( { antialias:true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0x333F47, 1 );

  document.body.appendChild( renderer.domElement );
  document.body.style.margin = 0;
  document.body.style.overflow = "hidden";

  var info = document.createElement( 'div' );
  info.style.position = 'absolute';
  info.style.top = '5px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.innerHTML = '<span style="color: #444; background-color: #ddd; border-bottom: 1px solid #ddd; padding: 8px 10px; text-transform: uppercase;"><strong>click</strong>: add voxel, <strong>drag</strong>: rotate | <a href="javascript:save();">save</a></span>';
  document.body.appendChild( info );


  // Make the base cube
  for ( var i = 0; i < divisor; i++ ) {
    for ( var j = 0; j < divisor; j++ ) {
      for ( var k = 0; k < divisor; k++ ) {
        // if ( (j===1&&k===1) || (k===1&&i===1) || (j===1&&i===1)) { continue; }
        var voxel = new THREE.Mesh(
          new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize ),
          new THREE.MeshLambertMaterial( { color: cubeColor, transparent: true, opacity:0.4 } )
        );
        voxel.position.set(
          ( i * cubeSize ),
          ( j * cubeSize ),
          ( k * cubeSize )
        );
        scene.add( voxel );
        base.push( voxel );
        if ( i === 0 && j === 0 && k === 0 ) {
          origin = voxel;
        }
      }
    }
  }
  // make base fractal
  fractal_cords = fractalize(base);
  fractal_cords.map( function (arr) {
    arr.map( function (cord) {
      var voxel = new THREE.Mesh(
        new THREE.BoxGeometry( miniCubeSize, miniCubeSize, miniCubeSize ),
        new THREE.MeshLambertMaterial( { color: cubeColor } )
      );
      voxel.position.set( cord.x, cord.y, cord.z );
      scene.add( voxel );
      fractal[ cord.x + "," + cord.y + "," + cord.z ] = true;
    });
  });

  brush = new THREE.Mesh(
    new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize ),
    new THREE.MeshLambertMaterial( { color: cubeColor, transparent: true, opacity: 0.4 } )
  );
  brush.position.y = 10000;
  brush.overdraw = true;
  scene.add( brush );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );

  document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );

  document.addEventListener( 'keydown', onDocumentKeyDown, false );
  document.addEventListener( 'keyup', onDocumentKeyUp, false );

  window.addEventListener( 'resize', onResizeWindow, false );
}

function setUpScene(){
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  cameraAngle( camera, theta, phi, radious );

  // LIGHTS
  var ambientLight = new THREE.AmbientLight( 0x404040 );
  scene.add( ambientLight );

  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.x = 1;
  directionalLight.position.y = 1;
  directionalLight.position.z = 0.75;
  directionalLight.position.normalize();
  scene.add( directionalLight );

  var directionalLight2 = new THREE.DirectionalLight( 0x808080 );
  directionalLight2.position.x = - 1;
  directionalLight2.position.y = 1;
  directionalLight2.position.z = - 0.75;
  directionalLight2.position.normalize();
  scene.add( directionalLight2 );
}

function cameraAngle (camera, theta, phi, radious) {
    camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
    camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.updateMatrix();
    camera.lookAt( middle );
}

function onResizeWindow () { 
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    animate();
}


function onDocumentMouseMove (event) {
  event.preventDefault();

  if ( isMouseDown ) {
    theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 ) + onMouseDownTheta;
    phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 ) + onMouseDownPhi;

    phi = Math.min( 180, Math.max( 0, phi ) );

    cameraAngle( camera, theta, phi, radious );
  }

  vector.set(
    ( event.clientX / window.innerWidth ) * 2 - 1,
    -( event.clientY / window.innerHeight ) * 2 + 1,
    0.5).unproject( camera );
  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

  interact();
  animate();
}

function onDocumentMouseDown (event) {
  event.preventDefault();

  isMouseDown = true;

  onMouseDownTheta = theta;
  onMouseDownPhi = phi;
  onMouseDownPosition.x = event.clientX;
  onMouseDownPosition.y = event.clientY;

}

function onDocumentMouseUp (event) {
  isMouseDown = false;

  onMouseDownPosition.x = event.clientX - onMouseDownPosition.x;
  onMouseDownPosition.y = event.clientY - onMouseDownPosition.y;
  if ( onMouseDownPosition.length() > 5 ) {
    return;
  }
  var intersects = raycaster.intersectObjects( base );
  if ( intersects.length > 0 ) {
    intersect = intersects[ 0 ].object == brush ? intersects[ 1 ] : intersects[ 0 ];
    if ( intersect ) {
      if ( isShiftDown ) {
          scene.remove( intersect.object );
          base.splice( base.indexOf( intersect.object ), 1 );
      } else {
        var voxel = new THREE.Mesh(
          new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize ),
          new THREE.MeshLambertMaterial( { color: cubeColor, visible: false } )
        );
        voxel.position.copy( intersect.point ).add( intersect.face.normal );
        voxel.position.addScalar( cubeSize/2 ).divideScalar( cubeSize ).floor().multiplyScalar( cubeSize );
        scene.add( voxel );
        base.push( voxel );

        fractal_cords = fractalize( base );
        fractal_cords.map( function (arr) {
          arr.map( function (cord) {
            cord_name = cord.x + "," + cord.y + "," + cord.z;
            if ( fractal[ cord_name ] !== true ) {
              var voxel = new THREE.Mesh(
              new THREE.BoxGeometry( miniCubeSize, miniCubeSize, miniCubeSize ),
              new THREE.MeshLambertMaterial( { color: cubeColor } )
              );
              voxel.position.set( cord.x, cord.y, cord.z );
              scene.add( voxel );
              fractal[ cord_name ] = true;
            }
          });
        });
      }
    }
  }
  interact();
  animate();
}

function onDocumentMouseWheel( event ) {
  event.preventDefault();

  radious -= event.wheelDeltaY;

  cameraAngle( camera, theta, phi, radious );

  interact();
  animate();
}

function onDocumentKeyDown( event ) {
  switch( event.keyCode ) {
    case 16: isShiftDown = true; interact(); animate(); break;
  }
}

function onDocumentKeyUp( event ) {
  switch( event.keyCode ) {
    case 16: isShiftDown = false; interact(); animate(); break;
  }
}

function interact () {
  var intersects = raycaster.intersectObjects( base );

  if ( intersects.length > 0 ) {
    intersect = intersects[ 0 ].object != brush ? intersects[ 0 ] : intersects[ 1 ];
    if ( intersect ) {
      brush.position.copy( intersect.point ).add( intersect.face.normal );
      brush.position.addScalar( cubeSize/2 ).divideScalar( cubeSize ).floor().multiplyScalar( cubeSize );

      return;
    }
  }
  brush.position.y = 10000;
}

function animate() {
  // requestAnimationFrame( animate );
  renderer.render( scene, camera );
  stats.update();
 }

function fractalize (base_vectors) {
  var size = origin.geometry.parameters.width;
  var origin_vector = origin.position;
  offset_base = createOffsetMap( base_vectors, origin_vector, size );
  fractal_base = scaleOffsetMap( base_vectors, offset_base, size );
  return fractal_base;
}

 function createOffsetMap (base_vectors, origin_vector, origin_size) {
  return base_vectors.map( function (vector) {
    var offset = new THREE.Vector3();
    offset.subVectors( origin_vector, vector.position );
    offset.divideScalar( origin_size );
    return offset;
  });
 }

 function scaleOffsetMap (base_vectors, offset_base, scale) {
  return base_vectors.map( function (vector) {
    return offset_base.map( function (offset) {
      var scaled_clone = offset.clone();
      scaled_clone.multiplyScalar( -scale/divisor ).add( vector.position );
      scaled_clone.addScalar( -scale/magicNumber( divisor ) );
      // that 3 at the end is magic and only works for a divisor of 3 for a divisor of 2:4, 3:3, 4:2.66
      return scaled_clone;
    });
  });
 }

function magicNumber (num) {
  switch ( num ) {
    case 2:
      return 4;
    case 3:
      return 3;
    case 4:
      return (8/3);
  }
}

function save () {
  brush.position.y = 10000;
  animate();
  window.open( renderer.domElement.toDataURL( 'image/png' ), 'mywindow' );
}