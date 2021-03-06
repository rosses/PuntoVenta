//
angular.module('samsungcot.controllers', [])

.controller('AddCtrl', function($scope, $ionicScrollDelegate, $localStorage, filterFilter, $state, $location, $anchorScroll, $rootScope, $stateParams) {
	$scope.showload();
	$scope.addprod = {};

  res = [];
  $scope.resList=res;

	jQuery.post(app.restApi+'services/?action=buscar&store='+$localStorage.app.store, { str: $stateParams.search }, function(data) {
		$scope.hideload();
		if (data.items.length == 0) {
			$rootScope.err("No se encontraron productos");
			$state.go("main.cotizar");
		}
		else {
			jQuery.each(data.items, function(index) {
				res.push(data.items[index]);
			});
		}
	},"json").fail(function() { $rootScope.err("No responde el servidor, revise su conexión a internet"); });

	$scope.cancelarAgregar = function() {
		$state.go("main.cotizar", { reload: true });
	};

})
.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicSideMenuDelegate, $ionicPopup, $ionicLoading) {

})

.controller('CotizarCtrl', function($scope, $state, $rootScope, $localStorage, $location, $timeout, $ionicLoading, $ionicPopup) {

  $scope.lineaMenos = function(codigo) {
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      if ($rootScope.cotLista[i].codigo == codigo) {
        if (parseInt($rootScope.cotLista[i].cantidad) == 1) {
          $rootScope.err("Minimo es 1");
        }
        else {
          var nva_qty=(parseInt($rootScope.cotLista[i].cantidad) - 1);
          if (nva_qty < $rootScope.cotLista[i].qtymayor) {
            $rootScope.cotLista[i].precio = $rootScope.cotLista[i].preciolista; // rollback price
          }
          $rootScope.cotLista[i].cantidad = nva_qty;
          $rootScope.cotLista[i].total = ($rootScope.cotLista[i].precio * $rootScope.cotLista[i].cantidad); 
        }
        break;
      }
    }
    $scope.calcularTotales();
  };

  $scope.lineaMas = function(codigo) {
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      if ($rootScope.cotLista[i].codigo == codigo) {
        var nva_qty=(parseInt($rootScope.cotLista[i].cantidad) + 1);
        if (nva_qty >= $rootScope.cotLista[i].qtymayor) {
          $rootScope.cotLista[i].precio = $rootScope.cotLista[i].preciomayor;
        }
        $rootScope.cotLista[i].cantidad = nva_qty;
        $rootScope.cotLista[i].total = ($rootScope.cotLista[i].precio * $rootScope.cotLista[i].cantidad); 
        break;
      }
    }
    $scope.calcularTotales();
  };
  $scope.lineaChao = function(codigo) {
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      if ($rootScope.cotLista[i].codigo == codigo) {
        $rootScope.cotLista.splice(i, 1); // borra i
        break;
      }
    }
    $scope.calcularTotales();
  };

  $scope.terminar = function() {
   var confirmPopup = $ionicPopup.confirm({
    title: 'Terminar',
    template: '¿Quieres imprimir?',
    buttons: [{ 
      text: 'NO',
      type: 'button-default',
      onTap: function(e) {
        return '0'
      }
    }, {
      text: 'SI',
      type: 'button-positive',
      onTap: function(e) {
        return '1'
      }
    }]
   });

   confirmPopup.then(function(res) {
     $scope.imprimir(res);
   });
  
  };

  $scope.agregarProducto = function() {
   cordova.plugins.barcodeScanner.scan(
      function (result) {

      jQuery.post(app.restApi+'services/?action=sku&store='+$localStorage.app.store, { alu: result.text }, function(data) {
        $scope.hideload();
        if (!data.hasOwnProperty("items") || data.items.length == 0) {
          $rootScope.err("No se encontraron productos");
          $state.go("main.cotizar");
        }
        else {
          $scope.agregarSeleccion(data.items[0]);
        }
      },"json").fail(function() { $rootScope.err("No responde el servidor, revise su conexión a internet"); });

      },
      function (error) {
          $rootScope.err("Error de escaner: "+error);
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

  $scope.limpiarCotizacion = function() {
    $rootScope.confirmar('¿Limpiar la cotización?', function() {
      $rootScope.cotLista = [];
    });
  
  };
  $scope.algo = "";

  $scope.buscarProducto = function() {

    $scope.data = {}

    var buscap =$ionicPopup.show({
      template: '<input type="text" class="buscador" ng-keypress="buscarEnter($event)" ng-model="data.algo">',
      title: 'Buscar producto',
      subTitle: '',
      scope: $scope,
      buttons: [
        { 
          text: 'Cerrar', 
          type: 'button-dark'
        },
        {
          text: '<b>Buscar</b>',
          type: 'button-positive',
          onTap: function(e) {
             if (!$scope.data.algo) {
              e.preventDefault();
             } else {
              if ($scope.data.algo.length > 1) {
                $state.go('main.add',{search:$scope.data.algo});
              }
              else {
                $rootScope.err('Ingrese 2 letras a lo menos');
                e.preventDefault();
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
          $state.go('main.add',{search:$scope.data.algo});
        }
        else {
          $rootScope.err('Ingrese 2 letras a lo menos');
        }
      }
    }
    
  };


  $scope.printRefresh = function() {
    $scope.cargandoPrinters = true;
    $scope.noPrinterFound = false;
    printers = [];
    $scope.printerList=printers;

    bluetoothSerial.list(function(devices) {
        $rootScope.err(JSON.stringify(devices));
    }, function(e) { $rootScope.err("err: ", JSON.stringify(e)); });

  };
  $scope.getCodigos = function() {
    var ret = [];
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      ret.push($rootScope.cotLista[i].codigo);
    }
    return ret;
  }

  $scope.getCantidades = function() {
    var ret = [];
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      ret.push($rootScope.cotLista[i].cantidad);
    }
    return ret;
  }
  $scope.getDescripciones = function() {
    var ret = [];
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      ret.push($rootScope.cotLista[i].descripcion);
    }
    return ret;
  }

  $scope.getUnitarios = function() {
    var ret = [];
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      ret.push($rootScope.cotLista[i].precio);
    }
    return ret;
  }

  $scope.getTotales = function() {
    var ret = [];
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      ret.push($rootScope.cotLista[i].total);
    }
    return ret;
  }


  $scope.imprimir = function(like) {
    function objetoImprimir() {

      var buffer = [];
      function _raw (buf) {
        buffer = buffer.concat(buf)
      }

      escpos(_raw)
      .hw()
      .set({align: 'center', width: 1, height: 2})
      .text($localStorage.app.comercio)
      .newLine(1)
      .text('COTIZACION')
      .newLine(1)
      .text('POINT SALE')
      .newLine(1)
      .text('---------------------------')
      .set({align: 'left', width: 1, height: 2})
      .newLine(1)
      .barcode($scope.getCodigos(),$scope.getCantidades(),$scope.getUnitarios(),$scope.getTotales(),$scope.getDescripciones(),'EAN13', 4, 90, 'BLW', 'B')
      .newLine(1)
      .set({align: 'center', width: 1, height: 2})
      .text('---------- TOTAL ----------')
      .newLine(1)
      .newLine(1)
      .set({align: 'left', width: 1, height: 2})
      .barcode2($rootScope.cotizacionNumber,'EAN13', 4, 90, 'BLW', 'B')
      .newLine(1)
      .text('$ '+miles($rootScope.neto))
      .set({align: 'center', width: 1, height: 1})
      .cut();

      return buffer;

    };

    if ($rootScope.cotLista.length == 0) {
      $rootScope.err("Cotizacion esta vacia");
    }
    else if (like == 1) {
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

        if (printTo == "" && like == 1) {
          $scope.hideload();
          $rootScope.err('No se encontro impresora ABAPRINT o QSPRINTER. Enciendala o reintente sin imprimir');
        }
        else {
          // send server

          $scope.showload();
          jQuery.post(app.restApi+"services/?action=save&store="+$localStorage.app.store+"&userid="+$localStorage.app.userid, {codes: $scope.getCodigos().join('|'), qtys: $scope.getCantidades().join('|') }, function(data) {

            $rootScope.cotizacionNumber = data.cotizacion;

            if (like == 1) {
              var buffer = new Uint8Array(objetoImprimir()).buffer;

              bluetoothSerial.isConnected(
                  function() {
                      bluetoothSerial.write(buffer, function() {
                        $scope.hideload();
                        $rootScope.cotLista = [];
                      }, function() {
                        $scope.hideload();
                        $rootScope.err('No se pudo imprimir');
                      });
                  },
                  function() {
                      bluetoothSerial.connect(printTo, function() {
                        bluetoothSerial.write(buffer, function() {
                          $scope.hideload();
                          $rootScope.cotLista = [];
                        }, function() {
                          $scope.hideload();
                          $rootScope.err('No se pudo imprimir');
                        });
                      }, function() {
                        $scope.hideload();
                        $rootScope.err('No se pudo conectar con '+printName)
                      });
                  }
              );
            }
            else {
              $rootScope.cotLista = [];
            }

            $rootScope.ok('Cotizacion OK<h3>'+data.cotizacion+'</h3>');
            $scope.hideload();

          },"json");

        }
      }, function(e) { $rootScope.err("err: ",JSON.stringify(e)); });     
    } 
    else if (like==0) {
      $scope.showload();
      jQuery.post(app.restApi+"services/?action=save&store="+$localStorage.app.store+"&userid="+$localStorage.app.userid, {codes: $scope.getCodigos().join('|'), qtys: $scope.getCantidades().join('|') }, function(data) {

        $rootScope.cotizacionNumber = data.cotizacion;
        $rootScope.ok('Cotizacion OK<h3>'+data.cotizacion+'</h3>');
        $scope.hideload();
        $rootScope.cotLista = [];
        $rootScope.cotizacionNumber = 0;
        $rootScope.neto = 0;
        $rootScope.iva = 0;
        $rootScope.total = 0;

      },"json");
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
          $rootScope.err('Problemas al conectar a su impresora. Valla a configuracion o intente mas tarde.');
          $scope.hideload();
        });
    });
  };
})

.controller('HomeCtrl', function($scope, $state, $rootScope, $localStorage, $location, $timeout, $ionicLoading, $ionicPopup) {
  
  $scope.goCotizar = function() {
    $state.go("main.cotizar");
  }


})


.controller('MainCtrl', function($scope, $state, $localStorage, $rootScope, $location, $ionicLoading, $ionicSideMenuDelegate) {

  /* Scopes for cotizador */
  $rootScope.cotLista = [];
  $scope.printerbox = {};
  $scope.cargandoPrinters = false;
  $scope.noPrinterFound = false;
  printers = [];
  $scope.printerList=printers;
  $rootScope.cotizacionNumber = 0;
  $rootScope.neto = 0;
  $rootScope.iva = 0;
  $rootScope.total = 0;

  $ionicSideMenuDelegate.canDragContent(false);
 
  if (!$localStorage.app) { $localStorage.app = app;  }
  if ($localStorage.app.auth == 0) {
      $location.path( "login", false );
  }

  $scope.app = $localStorage.app;
  $scope.CallTel = function(tel) {
    window.location.href = 'tel:'+ tel;
  }
  $scope.onSwipeLeft = function($e) {
    $e.stopPropagation();
  };
  $scope.onSwipeRight = function($e) {
    $e.stopPropagation();
  };
  
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


  $scope.agregarSeleccion = function(item) {
    if (item) { //$scope.addprod.sel
      // verificar existe
      var modificaExistente = 0;
      for (var i = 0; i < $rootScope.cotLista.length ; i++) {
        if ($rootScope.cotLista[i].codigo == item.codigo) {

          var nva_qty=(parseInt($rootScope.cotLista[i].cantidad) + 1);
          if (nva_qty >= $rootScope.cotLista[i].qtymayor) {
            $rootScope.cotLista[i].precio = $rootScope.cotLista[i].preciomayor;
          }

          $rootScope.cotLista[i].cantidad = nva_qty;
          $rootScope.cotLista[i].total = ($rootScope.cotLista[i].precio * $rootScope.cotLista[i].cantidad); 
          modificaExistente = 1;
          console.log('modificaExistente = 1');
          break;
        }
      }

      if (modificaExistente == 0) {
        item.cantidad = 1;
        item.total = (parseInt(item.precio) * 1);
        $rootScope.cotLista.push(item);
        console.log('modificaExistente = 0');
      }

      $scope.calcularTotales();
      $state.go("main.cotizar");

    }
    else {
      $rootScope.err('No esta agregando nada');
    }
  };

  $scope.calcularTotales = function() {
    var neto = 0;
    for (var i = 0; i < $rootScope.cotLista.length ; i++) {
      neto = parseInt(neto) + parseInt($rootScope.cotLista[i].total);
    }

    var iva = Math.round(neto * 0.19);
    var total = neto + iva;

    $rootScope.neto = neto;
    $rootScope.iva = iva;
    $rootScope.total = total;

  };

})

.controller('LoginCtrl', function($scope, $ionicPopup, $ionicLoading, $ionicHistory, $localStorage, $state, $rootScope, $location) {
  $scope.user = {
    code: '',
    user: '',
    pass : ''
  };
  $scope.botonesLogin = true;

  if (!$localStorage.app) { $localStorage.app = app; }

  if ($localStorage.app.auth == 1) {
    $state.go("main.home");
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
    $scope.showload();
    jQuery.post(app.restApi+"services/?action=validarLogin", {code: $scope.user.code, user: $scope.user.user, pass: $scope.user.pass}, function(data) {
      if (data.valid == 1) {
        app.auth = 1;
        app.userid = data.userid;
        app.user = $scope.user.user;
        app.pass = $scope.user.pass;
        app.code = $scope.user.code;
        app.store = data.store;
        app.comercio = data.comercio;
        app.nombre = data.nombre;

        $localStorage.app = app; //set storage

        $ionicHistory.nextViewOptions({
          disableBack: true,
          historyRoot: true
        });
        $state.go("main.home");
      }
      else {
        $ionicPopup.alert({
          title: 'Acceso denegado',
          content: 'No es valida la combinación de usuario y clave'
        }).then(function(res) {
          
        });
      }
      $scope.hideload();

    },"json");
  };
});


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