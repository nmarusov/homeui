'use strict';

angular.module('homeuiApp')
  .controller('RoomCtrl', ['$scope', '$routeParams', '$rootScope', 'CommonCode', function($scope, $routeParams, $rootScope, CommonCode){
    $scope.data = CommonCode.data;
    $scope.rooms = $scope.data.rooms;
    $scope.allWidgets = $scope.data.widgets;
    $scope.action = 'New';
    $scope.widgets = {};


    if ($routeParams.id) {
      $scope.action = 'Edit';
      $scope.roomID = $routeParams.id;
      $scope.$watch('rooms.' + $scope.roomID, function(){
        $scope.room = $scope.rooms[$routeParams.id];
        if($scope.room){
          $scope.$watch('room.widgets.length', function(){
      var newWidgets = {};

            $scope.room.widgets.forEach(function(widgetUid) {
              if ($scope.allWidgets.hasOwnProperty(widgetUid)) {
                newWidgets[widgetUid] = $scope.allWidgets[widgetUid];
              }
            });

      $scope.widgets = newWidgets;
          });
        }
      });
    }

    $scope.hoverIn = function(widget){
      widget.canEdit = true;
    };

    $scope.hoverOut = function(widget){
      widget.canEdit = false;
    };

    $scope.addOrUpdateRoom = function(){
      console.log('Start creating...');
      var room = {};

      room.uid = $scope.room.uid || ('room' + ($rootScope.objectsKeys($scope.rooms).length + 1));

      room.name = $scope.room.name;

      $scope.rooms[room.uid] = {uid: room.uid, name: room.name, widgets: $scope.room.widgets};

      var topic = '/config/rooms/' + room.uid;

      $scope.mqttSendCollection(topic, room, $rootScope.refererLocation);

      console.log('Successfully created!');
    };

    $scope.deleteWidget = CommonCode.deleteWidget;



  }]);
