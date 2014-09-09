(function() {
  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = {
    arrayEqual: function(arr1, arr2) {
      return JSON.stringify(arr1) === JSON.stringify(arr2);
    },
    capitalize: function(string) {
      return (string.split(' ').map(function(word) {
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      })).join(' ');
    },
    slugify: function(str) {
      str = str.replace(' ', '_');
      return str.toLowerCase();
    },
    unSlugify: function(str) {
      if (__indexOf.call(str, '_') >= 0) {
        str = str.replace('_', ' ');
      }
      return this.capitalize(str);
    }
  };

}).call(this);
