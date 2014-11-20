var scene, camera, renderer, onMouseDownPosition, origin, 
raycaster, cube, brush, vector, cubeGeo, cubeColor, cubeMat;
var base = [];
var fractal = [];
divisor =3;
var radious = 600, theta = 45, onMouseDownTheta = 45, phi = 60, onMouseDownPhi = 60,
  isMouseDown = false, isShiftDown = false;
var middle = new THREE.Vector3( 40.5 , 0, 40.5 );
 
  init();
  animate();

function init() {

	// Create the scene and set the scene size.
	scene = new THREE.Scene();
	var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

	// Create a renderer and add it to the DOM.
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(WIDTH, HEIGHT);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 10000);
  camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
  camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
  camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
  camera.lookAt( middle );
  scene.add(camera);

  window.addEventListener('resize', function() {
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  });

  renderer.setClearColor(0x333F47, 1);

  // LIGHT
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

  cubeGeo = new THREE.BoxGeometry(81, 81, 81);
  cubeColor = Math.random() * 0xffffff;
  cubeMat = new THREE.MeshLambertMaterial( { color: cubeColor } );

  // Make the base cube
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      for (var k = 0; k < 3; k++) {
        // if ( (j===1&&k===1) || (k===1&&i===1) || (j===1&&i===1)) { continue; }
        var voxel = new THREE.Mesh(
          cubeGeo,
          new THREE.MeshLambertMaterial( { color: cubeColor, visible: false } )
        );
        voxel.position.set(
          -40.5 + ( i * 81 ),
          -40.5 + ( j * 81 ),
          -40.5 + ( k * 81 )
        );
        scene.add(voxel);
        base.push(voxel);
        if ( i === 0 && j === 0 && k === 0 ) {
          origin = voxel;
        }
      }
    }
  }
  // make base fractal
  fractal_cords = fractalize(base);
  fractal_cords.map(function (arr) {
    arr.map( function (cord) {
      var voxel = new THREE.Mesh(
        new THREE.BoxGeometry(27, 27, 27),
        new THREE.MeshLambertMaterial({ color: cubeColor })
      );
      voxel.position.set(cord.x,cord.y,cord.z);
      scene.add(voxel);
      fractal.push(""+cord.x+cord.y+cord.z);
    });
  });

  brush = new THREE.Mesh(
    cubeGeo,
    new THREE.MeshLambertMaterial( { color: cubeColor, transparent: true, opacity: 0.4 } )
  );
  brush.position.y = 2000;
  brush.overdraw = true;
  scene.add( brush );

  onMouseDownPosition = new THREE.Vector2();

  raycaster = new THREE.Raycaster();
  vector = new THREE.Vector3();

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
}

function onDocumentMouseMove (event) {
  event.preventDefault();

  if ( isMouseDown ) {

    theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 ) + onMouseDownTheta;
    phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 ) + onMouseDownPhi;

    phi = Math.min( 180, Math.max( 0, phi ) );

    camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
    camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.updateMatrix();
    camera.lookAt( middle );

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
          cubeGeo,
          new THREE.MeshLambertMaterial( { color: cubeColor, visible: false } )
        );
        voxel.position.copy( intersect.point ).add( intersect.face.normal );
        voxel.position.divideScalar( 81 ).floor().multiplyScalar( 81 ).addScalar( 40.5 );
        scene.add( voxel );
        base.push( voxel );

        fractal_cords = fractalize(base);
        fractal_cords.map(function (arr) {
          arr.map( function (cord) {
            var voxel = new THREE.Mesh(
              new THREE.BoxGeometry(27, 27, 27),
              new THREE.MeshLambertMaterial({ color: cubeColor })
            );
            voxel.position.set(cord.x,cord.y,cord.z);
            cord_name = ''+cord.x+cord.y+cord.z;
            if (fractal.indexOf(cord_name) === -1) {
              scene.add(voxel);
              fractal.push(cord_name);
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

  camera.position.x = radious * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
  camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
  camera.position.z = radious * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
  camera.updateMatrix();
  camera.lookAt( middle );

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
      brush.position.divideScalar( 81 ).floor().multiplyScalar( 81 ).addScalar( 40.5 );

      return;
    }
  }
  brush.position.y = 2000;
}

function animate() {
  // requestAnimationFrame( animate );

  // Render the scene.
  // fractalize();
  renderer.render(scene, camera);
  stats.update();
 }

function fractalize (base_cords) {
  var offset_base = base_cords.map( function (voxel) {
    pos_offset = new THREE.Vector3();
    pos_offset.subVectors(origin.position, voxel.position);
    pos_offset.divideScalar(81);
    return pos_offset;
  });
  fractal_base = base_cords.map( function (voxel) {
    return offset_base.map(function (offset) {
      offset_clone = offset.clone();
      offset_clone.divideScalar(divisor);
      offset_clone.multiplyScalar(-81);
      return offset_clone.add(voxel.position).addScalar(-81/3);
    });
  });
  return fractal_base;
}