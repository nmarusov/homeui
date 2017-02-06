'use strict';

// Loosely based on
// http://odetocode.com/blogs/scott/archive/2014/04/21/better-error-handling-in-angularjs.aspx
angular.module('homeuiApp')
  .factory('errors', function ($rootScope){
    function showError (message, reason) {
      $rootScope.$broadcast('alert', message + ': ' + ((reason && reason.message) || reason), true);
    }
    return {
      showError: showError,
      hideError: function () {
        $rootScope.$broadcast('alert', '');
      },
      catch: function (message) {
        return function (reason) {
          showError(message, reason);
        };
      }
    };
  });
