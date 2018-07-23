var app = angular.module('walletApp', []);

app.controller('walletCtrl', function($scope, cryptoService, apiwaves, signService, Base58, converters) {
  $scope.waves = 0;
  $scope.assetList = [];

  //Get Wallet Balance
  function getBalance(address) {
    apiwaves.getWaves(address).then(onGetWavesSuccess, onError); //Get Waves Balance
    apiwaves.getAssets(address).then(onGetAssetsSuccess, onError); //Get Asset Balance
  }

  //Show Waves Balance
  var onGetWavesSuccess = function(response) {
    $scope.waves = toMoney(response.balance, 8);
    $scope.enoughWaves = response.balance > 100000000 ? true : false;
  }

  //Show Asset Balance
  var onGetAssetsSuccess = function(response) {
    //Re-initialize asset list
    let assetList = [];
    let address = $scope.sender.address;

    //Iterate through all assets
    response.balances.forEach(function(data) {
      let assetId = data.assetId;
      apiwaves.getAssetInfo(assetId).then((o, e) => {
        if (address === data.issueTransaction.sender) {
          assetList.push({
            assetid: data.assetId,
            name: data.issueTransaction.name,
            desc: data.issueTransaction.description,
            balance: toMoney(data.balance, data.issueTransaction.decimals),
            sponsorFee: o.minSponsoredAssetFee ? toMoney(o.minSponsoredAssetFee, data.issueTransaction.decimals) : 'n/a'
          });
        }        
      });
    });


    //Show Asset balance list
    $scope.assetList = assetList;
    console.log(response);
  }

  //Display Error
  var onError = function(response) {
    var msg = "Cannot retrieve data. Maybe your entered wrong input or the Node is offline.";
    alert(msg);
    console.log(msg);
  }

  //Convert from long to decimal (money)
  function toMoney(money, decimal) {
    var output = money / Math.pow(10, decimal)
    return output.toFixed(decimal)
  }

  $scope.submit = function(){
    var assetId = $scope.sponsorAssetId;
    var assetFee = $scope.sponsorAssetFee;
    var enoughWaves = $scope.enoughWaves;

    if (!enoughWaves){
      alert('Not enough Waves balance to issue sponsorhips');
    }
    else if (assetId && assetFee) {
        console.log('Submitted OK: ', assetId, " fee: ", assetFee);

        var sp = {
          type: 14,
          version: 1,
          senderPublicKey: $scope.sender.publicKey,
          assetId: assetId,
          minSponsoredAssetFee: assetFee,
          fee: 100000000,
          timestamp: Date.now()
        };

        var spSig = signService.signSponsorship(sp, $scope.sender.privateKey);

        var postReq = {
          type: sp.type,
          version: sp.version,
          senderPublicKey: sp.senderPublicKey,
          assetId: sp.assetId,
          minSponsoredAssetFee: sp.minSponsoredAssetFee,
          fee: sp.fee,
          timestamp: sp.timestamp,
          proofs:[spSig]
        };

        console.log('Asset Sponsorship: ');
        console.log(postReq);
        // Send HTTP POST Request
        apiwaves.issueSponsorship(postReq).then(onSponsorshipSuccess, onError);
    }
    else {
      alert('Asset Id or Fee cannot be null.');
    }

  };

  function onSponsorshipSuccess(response) {
    console.log('Successfully sponsoring asset: ', response);
    alert('Successfully sponsoring asset');
  }

  $scope.analyzeSeed = function(){
    var seed = $scope.seed;
    if (seed) {
      //Get Wallet Address
      var address = cryptoService.buildRawAddressFromSeed(seed);
      if (address) {
        $scope.sender.address = address;
        getBalance(address);
      }

      //Build Wallet Public & Private Key Pair
      var seedBytes = converters.stringToByteArray(seed);
      var walletKeyPair = cryptoService.buildKeyPair(seedBytes);
      $scope.sender.publicKey = walletKeyPair.public;
      $scope.sender.privateKey = walletKeyPair.private;
    }
  }

  function initSender(){
    $scope.sender = {
      address: 'n/a',
      publicKey: 'n/a',
      privateKey: 'n/a',
      balance: 0
    };

    $scope.analyzeSeed();
  }

  initSender();
});
