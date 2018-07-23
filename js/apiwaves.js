(function() {

  var apiwaves = function($http) {

    const GATEWAY_URL = 'https://coinomat.com/api/v1';

    const TEST_NODE = 'https://testnode1.wavesnodes.com';
    const MAIN_NODE = 'https://nodes.wavesnodes.com'
    const WAVES_NODE = TEST_NODE;

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#get-transactionsinfoid
    var getTxInfo = function(txId) {
      var url = WAVES_NODE + '/transactions/info/' + txId;
      return $http.get(url).then(promise);
    }

    var getAssetInfo = function(assetId){
      var url = WAVES_NODE + '/assets/details/' + assetId;
      return $http.get(url).then(promise);
    }

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#get-addressesbalanceaddress
    var getWaves = function(address) {
      var url = WAVES_NODE + '/addresses/balance/' + address;
      return $http.get(url).then(promise);
    }

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#get-assetsbalanceaddress
    var getAssets = function(address) {
      var url = WAVES_NODE + '/assets/balance/' + address;
      return $http.get(url).then(promise);
    }

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#get-assetsbalanceaddressassetid
    var getAddressAssetBalance = function(address, assetId) {
      var url = WAVES_NODE + '/assets/balance/' + address + '/' + assetId;
      return $http.get(url).then(promise)
    }

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#get-transactionsaddressaddresslimitlimit
    var getAddressTxHistory = function(address, limit) {
      var url = WAVES_NODE + '/transactions/address/' + address + '/limit/' + limit;
      return $http.get(url).then(promise);
    }

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#get-transactionsunconfirmed
    var getAddressTxUnconfirmed = function(address) {
      var url = WAVES_NODE + '/transactions/unconfirmed';
      return $http.get(url).then(promise);
    }

    //https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#post-assetsbroadcasttransfer
    var transferAsset = function(transaction) {
      var url = WAVES_NODE + '/assets/broadcast/transfer';
      return $http.post(url, transaction).then(promise);
    }

    var issueSponsorship = function(sponsorship){
      //var url = WAVES_NODE + '/assets/broadcast/sponsor';
      var url = WAVES_NODE + '/transactions/broadcast';
      return $http.post(url, sponsorship).then(promise);
    }

    //Check whether a given address is a valid waves wallet address
    var validateAddress = function(address) {
      var url = WAVES_NODE + '/addresses/validate/' + address;
      return $http.get(url).then(promise);
    }

    var promise = function(response) {
      return response.data;
    }

    var getAddressGateway = function(sourceCurrency, targetCurrency, address) {
      var history = 'history=0';
      var lang = 'lang=ru_RU';
      var sourceCur = 'currency_from=' + sourceCurrency;
      var targetCur = 'currency_to=' + targetCurrency;
      var walletAdd = 'wallet_to=' + address;
      var url1 = GATEWAY_URL + '/create_tunnel.php?' + sourceCur + '&' + targetCur + '&' + walletAdd;

      return $http.get(url1).then(function(response) {
        if (!response.status == 200) {
          console.log(response);
          throw new Error('Failed to create tunnel: ' + response.error);
        }

        return {
          id: response.data.tunnel_id,
          k1: response.data.k1,
          k2: response.data.k2
        };

      }).then(function(tunnel) {
        var xt = 'xt_id=' + tunnel.id;
        var k1 = 'k1=' + tunnel.k1;
        var k2 = 'k2=' + tunnel.k2;
        var url2 = GATEWAY_URL + '/get_tunnel.php?' + history + '&' + k1 + '&' + k2 + '&' + lang + '&' + xt;

        return $http.get(url2);

      }).then(function(response) {

        if (!response.data.tunnel) {
          console.log(response);
          throw new Error('Failed to get tunnel: ' + response.error);
        }

        return {
          address: response.data.tunnel.wallet_from,
          attachment: response.data.tunnel.attachment
        };

      });
    }

    return {
      getAddressGateway: getAddressGateway,
      validateAddress: validateAddress,
      transferAsset: transferAsset,
      issueSponsorship: issueSponsorship,
      getAddressAssetBalance: getAddressAssetBalance,
      getAddressTxHistory: getAddressTxHistory,
      getAddressTxUnconfirmed: getAddressTxUnconfirmed,
      getAssetInfo: getAssetInfo,
      getTxInfo: getTxInfo,
      getWaves: getWaves,
      getAssets: getAssets
    }
  }

  var app = angular.module('walletApp');
  app.service('apiwaves', apiwaves);

}())
