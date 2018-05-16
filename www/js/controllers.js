//
angular.module('samsungcot.controllers', [])

.controller('AddCtrl', function($scope, $ionicScrollDelegate, filterFilter, $state, $location, $anchorScroll, $stateParams) {
	$scope.showload();
	$scope.addprod = {};
	//alert($scope.cotLista.length);
  res = [];
  $scope.resList=res;

	jQuery.post(app.restApi+'services/?action=buscar&store_code=002', { str: $stateParams.search }, function(data) {
		$scope.hideload();
		//alert(JSON.stringify(data));
		if (data.items.length == 0) {
			err("No se encontraron productos");
			$state.go("home.main");
		}
		else {
			jQuery.each(data.items, function(index) {
				res.push(data.items[index]);
			});
			//alert($scope.cotLista.length);
		}
	},"json").fail(function() { err("No responde el servidor, revise su conexión a internet"); });

	$scope.cancelarAgregar = function() {
		$state.go("home.main");
	};



})
.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicSideMenuDelegate, $ionicPopup, $ionicLoading) {

})

.controller('HomeCtrl', function($scope, $state, $localStorage, $location, $timeout, $ionicLoading, $ionicPopup) {
  
  
  if (!$localStorage.app) { $localStorage.app = app;  }
  if ($localStorage.app.auth == 0) {
      $location.path( "login", false );
  }

  $scope.cotizacionNumber = 0;
  
  $scope.showload = function() {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>'
    }).then(function(){
       //console.log("The loading indicator is now displayed");
    });
  };
  $scope.hideload = function(){
    $ionicLoading.hide().then(function(){
       //console.log("The loading indicator is now hidden");
    });
  };

  $scope.cotLista = [];
  $scope.printerbox = {};
  $scope.cargandoPrinters = false;
  $scope.noPrinterFound = false;
  printers = [];
  $scope.printerList=printers;
  $scope.agregarProducto = function() {
   cordova.plugins.barcodeScanner.scan(
      function (result) {

      jQuery.post(app.restApi+'services/?action=sku&store_code=002', { alu: result.text }, function(data) {
        $scope.hideload();
        //alert(JSON.stringify(data));
        if (data.items.length == 0) {
          err("No se encontraron productos");
          $state.go("home.main");
        }
        else {
          $scope.agregarSeleccion(data.items[0]);
          //alert($scope.cotLista.length);
        }
      },"json").fail(function() { err("No responde el servidor, revise su conexión a internet"); });

      },
      function (error) {
          err("Error de escaner: "+error);
      },
      {
          preferFrontCamera : false, // iOS and Android
          showFlipCameraButton : false, // iOS and Android
          showTorchButton : true, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          saveHistory: false, // Android, save scan history (default false)
          prompt : "Por favor ajuste el codigo al centro", // Android
          resultDisplayDuration: 0, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          formats : "QR_CODE,PDF_417,CODE_128,EAN_13,CODE_39", // default: all but PDF_417 and RSS_EXPANDED
          //orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          disableAnimations : true, // iOS
          disableSuccessBeep: false // iOS and Android
      }
   );
  }
  $scope.agregarSeleccion = function(item) {
    if (item) { //$scope.addprod.sel
      // verificar existe
      console.log(item);
      var modificaExistente = 0;
      for (var i = 0; i < $scope.cotLista.length ; i++) {
        if ($scope.cotLista[i].codigo == item.codigo) {
          $scope.cotLista[i].cantidad = (parseInt($scope.cotLista[i].cantidad) + 1);
          $scope.cotLista[i].total = ($scope.cotLista[i].precio * $scope.cotLista[i].cantidad); 
          modificaExistente = 1;
          break;
        }
      }

      if (modificaExistente == 0) {
        item.cantidad = 1;
        item.total = (parseInt(item.precio) * 1);
        $scope.cotLista.push(item);
      }

      $scope.calcularTotales();
      $state.go("home.main");

    }
    else {
      err('No esta agregando nada');
    }
  };

	$scope.limpiarCotizacion = function() {
      var confirmPopup = $ionicPopup.confirm({
         title: 'Vaciar cotizacion',
         template: '¿Esta seguro?'
      });

      confirmPopup.then(function(res) {
         if(res) {
            $scope.cotLista = [];
         } else {
            
         }
      });
	
	};
  $scope.algo = "";

	$scope.buscarProducto = function() {
    /*
		$state.go('home.add',{search: 'galaxy'});
		
    navigator.notification.prompt(
        'Ingrese texto a buscar',  // message
        function(results) { 
        	if (results.buttonIndex == 1) {
        		if (results.input1.length > 1) {
        			$state.go('home.add',{search: results.input1});
        		}
        		else {
        			err('Ingrese 2 letras a lo menos');
        		}
        	} 
        },                  // callback to invoke
        'Agregar producto',            // title
        ['Ok','Cancelar']              // buttonLabels
    );*/
    
    $scope.data = {}

    var buscap =$ionicPopup.show({
      template: '<input type="text" ng-keypress="buscarEnter($event)" ng-model="data.algo">',
      title: 'Buscar producto',
      subTitle: '',
      scope: $scope,
      buttons: [
        { text: 'Cerrar' },
        {
          text: '<b>Buscar</b>',
          type: 'button-positive',
          onTap: function(e) {
             if (!$scope.data.algo) {
              e.preventDefault();
             } else {
              //alert($scope.data.algo);
              if ($scope.data.algo.length > 1) {
                $state.go('home.add',{search:$scope.data.algo});
              }
              else {
                err('Ingrese 2 letras a lo menos');
              }
             }
          }
        }
      ]
    });

    $scope.buscarEnter = function(keyEvent) {
      if (keyEvent.which === 13) {
        if ($scope.data.algo.length > 1) {
          buscap.close();
          $state.go('home.add',{search:$scope.data.algo});
        }
        else {
          err('Ingrese 2 letras a lo menos');
        }
      }
    }
    
	};


	$scope.neto = 0;
	$scope.iva = 0;
	$scope.total = 0;

	$scope.calcularTotales = function() {
		var neto = 0;
		for (var i = 0; i < $scope.cotLista.length ; i++) {
			neto = parseInt(neto) + parseInt($scope.cotLista[i].total);
		}

		var iva = Math.round(neto * 0.19);
		var total = neto + iva;

		$scope.neto = neto;
		$scope.iva = iva;
		$scope.total = total;

	};

  $scope.printRefresh = function() {
    $scope.cargandoPrinters = true;
    $scope.noPrinterFound = false;
    printers = [];
    $scope.printerList=printers;
    /*
    ble.startScan([], function(device) {
      //err(JSON.stringify(device));
      printer = { nombre: device.name, id: device.id };
      printers.push(printer);

    } , function(x) {
      // ERR
      err('ERR: '+JSON.stringify(x));
    })

    $timeout(function() {
      //alert('timeout');

      $scope.cargandoPrinters = false;
      $scope.printerList=printers;

      if (printers.length == 0) {
        $scope.noPrinterFound = true;
      }

      ble.stopScan(function() {}, function() {});

    },5000)
  */
  bluetoothSerial.list(function(devices) {
      err(JSON.stringify(devices));
  }, function(e) { err('err'); err(JSON.stringify(e)); });

  };
  $scope.getCodigos = function() {
  	var ret = [];
		for (var i = 0; i < $scope.cotLista.length ; i++) {
			ret.push($scope.cotLista[i].codigo);
		}
		return ret;
  }

  $scope.getCantidades = function() {
  	var ret = [];
		for (var i = 0; i < $scope.cotLista.length ; i++) {
			ret.push($scope.cotLista[i].cantidad);
		}
		return ret;
  }
  $scope.getDescripciones = function() {
    var ret = [];
    for (var i = 0; i < $scope.cotLista.length ; i++) {
      ret.push($scope.cotLista[i].descripcion);
    }
    return ret;
  }


  $scope.imprimir = function() {

    function objetoImprimir() {

      var buffer = [];
      function _raw (buf) {
        buffer = buffer.concat(buf)
      }

      escpos(_raw)
      .hw()
      .set({align: 'center', width: 1, height: 2})
      .text('PUNTO DE VENTA')
      .newLine(1)
      .text('PRE-VENTA')
      .newLine(1)
      .text('POINTSALE.CL')
      .newLine(1)
      .text('---------------------------')
      .set({align: 'left', width: 1, height: 2})
      .newLine(1)
      .barcode($scope.getCodigos(),$scope.getCantidades(),$scope.getDescripciones(),'EAN13', 4, 90, 'BLW', 'B')
      .newLine(1)
      .set({align: 'center', width: 1, height: 2})
      .text('---------- TOTAL ----------')
      .newLine(1)
      .set({align: 'left', width: 1, height: 2})
      .barcode2($scope.cotizacionNumber,'EAN13', 4, 90, 'BLW', 'B')
      .newLine(1)
      .text('$ '+miles($scope.neto))
      .set({align: 'center', width: 1, height: 1})
      .cut();

      return buffer;

    };

  	if ($scope.cotLista.length == 0) {
  		err("Cotizacion esta vacia");
  	}
    else {
      $scope.showload();
      bluetoothSerial.list(function(devices) {
        var printTo = "";
        var printName = "";
        devices.forEach(function(device) {
          if (device.name.toLowerCase().indexOf("abaprint") >= 0 || device.name.toLowerCase().indexOf("qsprinter") >= 0) {
            printTo = device.address;
            printName = device.name;
          }
        });

        if (printTo == "") {
          $scope.hideload();
          err('No se encontro impresora ABAPRINT o QSPRINTER. Enciendala');
        }
        else {
          // send server

          $scope.showload();
          jQuery.post(app.restApi+"services/?action=save", {codes: $scope.getCodigos().join('|'), qtys: $scope.getCantidades().join('|'), descs: $scope.getDescripciones().join('|')}, function(data) {

            $scope.cotizacionNumber = data.cotizacion;

            var buffer = new Uint8Array(objetoImprimir()).buffer;

            bluetoothSerial.isConnected(
                function() {
                    bluetoothSerial.write(buffer, function() {
                      $scope.hideload();
                      //$scope.cotLista = [];
                    }, function() {
                      $scope.hideload();
                      err('No se pudo imprimir');
                    });
                },
                function() {
                    bluetoothSerial.connect(printTo, function() {
                      bluetoothSerial.write(buffer, function() {
                        $scope.hideload();
                        $scope.cotLista = [];
                      }, function() {
                        $scope.hideload();
                        err('No se pudo imprimir');
                      });
                    }, function() {
                      $scope.hideload();
                      err('No se pudo conectar con '+printName)
                    });
                }
            );

            $scope.hideload();

          },"json");

        }
      }, function(e) { err('err'); err(JSON.stringify(e)); });



      
      /*ble.isConnected(app.impID, function() {
        ble.writeWithoutResponse(app.impID, app.impSERV, app.impCHAR, buffer, function(x) { 
        	// Estaba conectado y todo OK 1
        	$scope.cotLista = [];
        }, function(x) { 
        	err('No se pudo imprimir '+JSON.stringify(x)); 
        });
      }, function() {

        ble.connect(app.impID, function(peripheral) {
          $scope.hideload();
          ble.writeWithoutResponse(app.impID, app.impSERV, app.impCHAR, buffer, function(x) {
          	// Me he conectado y todo OK 2
          	$scope.cotLista = [];
          }, function(x) { 
          	err('No se pudo imprimir '+JSON.stringify(x)); 
          });
        }, function() { 
        	$scope.hideload();
          err('Problemas al conectar a su impresora. Valla a configuracion. refrescar y reconecte para imprimir nuevamente.');
        });

      });*/

      
    } 
  };


  $scope.impActivar = function(item) {
  
  	$scope.showload();
    app.impNN = item.currentTarget.getAttribute("data-nombre");
    app.impID = $scope.printerbox.sel;
    $localStorage.app = app;

    ble.isConnected(app.impID, function() {
    }, function() {
        ble.connect(app.impID, function(peripheral) {
          $scope.hideload();
        }, function() { 
          err('Problemas al conectar a su impresora. Valla a configuracion o intente mas tarde.');
          $scope.hideload();
        });
    });
  };

})


.controller('MainCtrl', function($scope, $state, $localStorage, $location) {
	$scope.lineaMenos = function(codigo) {
		for (var i = 0; i < $scope.cotLista.length ; i++) {
			if ($scope.cotLista[i].codigo == codigo) {
				if (parseInt($scope.cotLista[i].cantidad) < 1) {
					err("Minimo es 1");
				}
				else {
					$scope.cotLista[i].cantidad = (parseInt($scope.cotLista[i].cantidad) - 1);
					$scope.cotLista[i].total = ($scope.cotLista[i].precio * $scope.cotLista[i].cantidad); 
				}
				break;
			}
		}
		$scope.calcularTotales();
	};

	$scope.lineaMas = function(codigo) {
		for (var i = 0; i < $scope.cotLista.length ; i++) {
			if ($scope.cotLista[i].codigo == codigo) {
				$scope.cotLista[i].cantidad = (parseInt($scope.cotLista[i].cantidad) + 1);
				$scope.cotLista[i].total = ($scope.cotLista[i].precio * $scope.cotLista[i].cantidad); 
				break;
			}
		}
		$scope.calcularTotales();
	};
	$scope.lineaChao = function(codigo) {
		for (var i = 0; i < $scope.cotLista.length ; i++) {
			if ($scope.cotLista[i].codigo == codigo) {
				//delete $scope.cotLista[i]; // incompatible
				$scope.cotLista.splice(i, 1); // borra i
				break;
			}
		}
		$scope.calcularTotales();
	};

})

.controller('LoginCtrl', function($scope, $ionicPopup, $ionicLoading, $localStorage, $state, $location) {
  $scope.user = {
    username: '',
    password : ''
  };

  if (!$localStorage.app) { $localStorage.app = app; }
  else {
    if ($localStorage.app.auth == 1) {
      //$location.path( "home/main", false );
      $state.go( "home.main" );
    }
  }
  

  $scope.showload = function() {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>'
    }).then(function(){
       //console.log("The loading indicator is now displayed");
    });
  };
  $scope.hideload = function(){
    $ionicLoading.hide().then(function(){
       //console.log("The loading indicator is now hidden");
    });
  };

  $scope.signIn = function(form) {
    //console.log(form);
    if(form.$valid) {
      $scope.showload();
      jQuery.post(app.restApi+"services/?action=validarInstalacion", {clave: $scope.user.password}, function(data) {
        if (data.clave == 1) {
          app.auth = 1;
          $localStorage.app = app;         
          $state.go( "home.main" );
        }
        else {
          $ionicPopup.alert({
            title: 'No autorizado',
            content: 'La clave es inválida'
          }).then(function(res) {
            
          });
        }
        $scope.hideload();

      },"json");
      
    }
  };
});

function err(msg) {
  console.log(msg);
  navigator.notification.alert(
      (msg ? msg : 'Error al consultar el servicio. Intente más tarde'),  // message
      function() { },
      'Error',
      'OK'
  );
}

String.prototype.toBytes = function() {
    var arr = []
    for (var i=0; i < this.length; i++) {
    arr.push(this[i].charCodeAt(0))
    }
    return arr
}

function miles(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? ',' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }
    return x1 + x2;
}