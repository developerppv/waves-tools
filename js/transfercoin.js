var app = angular.module('walletApp', []);

app.controller('walletCtrl', function($scope, cryptoService, apiwaves, signService, Base58, converters) {
  $scope.enoughBalance = false;

  $scope.transferCoin = function() {
    //Check Wallet Public & Private Key Pair
    if (!$scope.sender.publicKey){
      alert('Please enter sender wallet seed!');
      return;
    }

    // if (!$scope.enoughBalance){
    //   alert('Not enough money to perform transfer!');
    //   return;
    // }

    //Check recipient address
    if (!$scope.recipient){
      alert('Please enter recipient address!');
      return;
    }

    //When all checkings are completed, then perform transfer process
    transferAsset();
  }

  function transferAsset() {

    //Create Tx Data
    var tx = {
      assetId: $scope.selectedAsset.assetId,
      senderPublicKey: $scope.sender.publicKey,
      recipient: $scope.recipient,
      feeAssetId: $scope.selectedFee.assetId,
      fee: $scope.selectedFee.amount,
      amount: $scope.transferAmount,
      attachment: "Asset Transfer",
      timestamp: Date.now()
    }

    //Create Tx Data Signature
    var txSig = signService.signTransfer(tx, $scope.sender.privateKey);

    //Create HTTP POST Request
    var postRequest = {
      assetId: tx.assetId,
      senderPublicKey: tx.senderPublicKey,
      recipient: tx.recipient,
      fee: tx.fee,
      feeAssetId: tx.feeAssetId,
      amount: tx.amount,
      attachment: Base58.encode(converters.stringToByteArray(tx.attachment)),
      timestamp: tx.timestamp,
      signature: txSig
    };

    // Send HTTP POST Request
    apiwaves.transferAsset(postRequest).then(onTransferSuccess, onError);
  }

  //Get Waves and Asset Balance of a given address
  function getBalance(address) {
    apiwaves.getAssets(address).then(onGetAssetsSuccess, onError); //Get Asset Balance
  }

  //Display Asset Balance and Warning if it is not enough for transaction
  function onGetAssetsSuccess(response) {
    assetList = [];
    feeList = [];

    //Iterate through all assets
    response.balances.forEach(function(data) {
      let assetId = data.assetId;
      apiwaves.getAssetInfo(assetId).then((o, e) => {

        //Add to list of assets
        assetList.push({
          assetId: data.assetId,
          name: data.issueTransaction.name,
          desc: data.issueTransaction.description,
          balance: toMoney(data.balance, data.issueTransaction.decimals),
          sponsorFee: o.minSponsoredAssetFee ? toMoney(o.minSponsoredAssetFee, data.issueTransaction.decimals) : 'n/a',
          decimals: data.issueTransaction.decimals
        });

        //Add to list of tx-fee
        if (o.minSponsoredAssetFee) {
          feeList.push({
            assetId: data.assetId,
            name: data.issueTransaction.name,
            amount: o.minSponsoredAssetFee,
            decimals: data.issueTransaction.decimals
          });
        }

      });
    });

    apiwaves.getWaves($scope.sender.address).then((data,error) => {
      assetList.push({
        assetId: null,
        name: 'WAVES',
        desc: 'WAVES',
        balance: toMoney(data.balance, 8),
        sponsorFee: toMoney(100000, 8),
        decimals: 8
      });

      feeList.push({
        assetId: null,
        name: 'WAVES',
        amount: 100000,
        decimals: 8
      });
    });

    //Show Asset balance list
    $scope.sender.balanceList = assetList;
    $scope.sender.feeList = feeList;
    console.log(response);
  }

  //Display Transfer Response in Console Log
  function onTransferSuccess(response) {
    var amount = toMoney(response.amount, $scope.selectedAsset.decimals);
    var assetName = $scope.selectedAsset.name;
    var address = response.sender;
    var recipient = response.recipient;
    var feeName = $scope.selectedFee.name;
    var feeAmount = toMoney($scope.selectedFee.amount, $scope.selectedFee.decimals);
    alert('Success: ' + amount + ' ' + assetName + ' has been transfered from ' + address + ' to ' + recipient + ' with tx-fee: ' + feeAmount + ' ' + feeName);
    console.log(response);
  }

  //Display Error
  var onError = function(response) {
    console.log("Error: Ouch!");
  }

  //Convert from long to decimal (money)
  function toMoney(money, decimal) {
    var output = money / Math.pow(10, decimal);
    return output.toFixed(decimal);
  }

  //Convert from decimal to long (coin)
  function toCoin(money, decimal) {
    var output = money * Math.pow(10, decimal);
    return output;
  }

  $scope.setFeeAmount = function(){
    if ($scope.selectedFee){
      $scope.feeAmount = $scope.selectedFee.amount;
    }
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
      balanceList: [],
      feeList: []
    };

    $scope.analyzeSeed();
  }

  initSender();

});
