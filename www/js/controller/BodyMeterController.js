angular.module('starter.BodyMeterControllers', [])

  //体組成測定
  .controller('BodyMeterCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, SERVICE_COMMON) {
    $scope.$on('$ionicView.enter', function () {

      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (SERVICE_COMMON.isset(personal) || localStorage.getItem('Tutorial') == 0) {
        var user_id = personal['user_id'];
      } else {
        SERVICE_COMMON.popup('個人設定が未登録のためデータを表示できません');
        return false;
      }
      $scope.personal = personal;
      $scope.getBodyMeterList(personal);  

    });

    //カメラを起動しQRを読み取る
    $scope.scanQr = function () {
      //体組成計から送られた生データを取得できる  
      cordova.plugins.barcodeScanner.scan(
        function (data) {
          console.log(data.text);
          var qrData = JSON.parse(data.text);
          $scope.regBodyMeter(qrData);
        },
        function (error) {
          alert("読み取りに失敗しました: " + error);
        },
        SERVICE_COMMON.BarcodeScanSetting('QRコードをスキャンしてください')
      );
    }
    //体組成情報登録
    $scope.regBodyMeter = function (qrData) {
        var machineId = qrData['machineId'];
        var measurementDate = qrData['measurementDate'];
        var measurementData = qrData['measurementData'];
        //取得した生データをJsonに成形する。
        var arr = measurementData.split(',');
        console.log(JSON.stringify(arr));
        //偶数部をkeyに奇数部をvalueの辞書型に
        var idx_key = 0;
        var idx_value = 1;
        var jsonObj = [];
        for (var i = 0; i <= arr.length - 1; i++) {
            if (idx_key == arr.length) {
                break;
            }
            var temp = { "key": arr[idx_key], "value": arr[idx_value] };
            jsonObj.push(temp);
            idx_key += 2;
            idx_value += 2;
        }
        //生成したJsonをデータベースへ登録
        var user_id = $scope.personal.user_id;
        var postData = { "user_id": user_id, "machine_id": machineId, "measurement_date": measurementDate, "measurement_data": jsonObj };
        var url = SERVICE_COMMON.getParameter('api_reg_bodymeter_result');
        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    SERVICE_COMMON.toast(data['msg']);
                    //一覧再作成
                    $timeout(function () {
                        //測定ポイント付与
                        $scope.GivePoint('bodymeter_month',27);
                        $scope.getBodyMeterList($scope.personal);
                    }, 500);
                } else if (data['result'] == '9') {
                    SERVICE_COMMON.toast(data['msg']);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(JSON.stringify(jqXHR));
            });
    }
    //最新の体組成測定データを一覧に表示
    $scope.getBodyMeterList = function (personal) {
        //ローディング開始
        SERVICE_COMMON.loading();
        personal['saishin_flg'] = 1;
        var url = SERVICE_COMMON.getParameter('api_get_bodymeter');
        $.ajax(SERVICE_COMMON.getAjaxOption(url, personal))
            .done(function (data, textStatus, jqXHR) {
                //ローディング完了
                SERVICE_COMMON.loading_comp();
                if (data['result'] == '0') {
                    var bodyData = data['data']['bodyData'];
                    //測定日が最新のデータを取得する
                    var measurement_date = Enumerable.from(bodyData).max(x => x.measurement_date);
                    console.log(measurement_date);
                    var measurement_data = Enumerable.from(bodyData)
                        .where(x => x.measurement_date == measurement_date)
                        .select(x => x.measurement_data)
                        .first();
                    measurement_data = Enumerable.from(measurement_data).where(x => x.output_flg == '1').toArray();
                    $scope.measurement_date = moment(measurement_date).format('YYYY年MM月DD日');
                    $scope.meterResults = measurement_data

                    //measurement_dataから筋肉量÷体重を計算(%)
                    var muscle = Enumerable.from(measurement_data).where(x => x.header_name == 'mW').select(x => x.value).first();
                    var weight = Enumerable.from(measurement_data).where(x => x.header_name == 'Wk').select(x => x.value).first();
                    var muscle_rate = (muscle / weight * 100).toFixed(1);

                    //測定日が4月1日～5月31日、12月1日～31日の場合、$scope.RegMuscleRateを呼び出す
                    var date = moment(measurement_date).format('MM/DD');
                    date = '12/31';
                    if ((date >= '04/01' && date <= '05/31') || (date >= '12/01' && date <= '12/31')) {
                        $scope.RegMuscleRate(muscle_rate);
                    }

                    // console.log(JSON.stringify(measurement_data));
                } else if (data['result'] == '9') {
                    SERVICE_COMMON.toast(data['msg']);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(JSON.stringify(jqXHR));
                //ローディング完了
                SERVICE_COMMON.loading_comp();
            });
    }

    $scope.RegMuscleRate = function (muscle_rate){
        var user_id = $scope.personal.user_id;
        var postData = { "user_id": user_id, "muscle_rate": muscle_rate};
        var url = SERVICE_COMMON.getParameter('api_reg_musclerate');
        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    SERVICE_COMMON.toast(data['msg']);
                } else if (data['result'] == '9') {
                    SERVICE_COMMON.toast(data['msg']);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(JSON.stringify(jqXHR));
            });
    }

    //測定記録一覧へ
    $scope.listMove = function () {
      //ページ遷移
      SERVICE_COMMON.MovePage('#/tab/bodymeter/bodymeter_list/');
    }

    //ポイント付与
    $scope.GivePoint = function (challenge_type,challenge_id) {
        //個人設定を取得
        var personal = JSON.parse(localStorage.getItem('Personal'));
        if (SERVICE_COMMON.isset(personal)) {
            user_id = personal['user_id'];
        } else {
            SERVICE_COMMON.toast('個人設定が登録されていないため体組成測定ができません');
            return false;
        }
        //クリア-ポイント付与
        var url = SERVICE_COMMON.getParameter('api_reg_givepoint');
        var data = {};
        data['user_id'] = user_id;
        data['challenge_type'] = challenge_type;
        data['challenge_id'] = challenge_id;
        $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    //SERVICE_COMMON.toast('ポイントを獲得しました');
                } else if (data['result'] == '1') {
                    //SERVICE_COMMON.toast('すでにポイント獲得済みです');
                } else {
                    SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
            });
    }

  })
  //測定一覧
  .controller('BodyMeterListCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, SERVICE_COMMON) {
    $scope.$on('$ionicView.enter', function () {
      //初期日付
      $scope.targetYM = {"date":new Date(moment())};
      //一覧に表示
      $scope.getBodyMeterList();
    });
    //最新の体組成測定データを一覧に表示
    $scope.getBodyMeterList = function () {
      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (!SERVICE_COMMON.isset(personal)) {
        SERVICE_COMMON.popup('個人設定が未登録のためデータを表示できません');
        return false;
      }
      //ローディング開始
      SERVICE_COMMON.loading();
      personal['targetYM'] = moment($scope.targetYM.date).format('YYYY/MM');
      var url = SERVICE_COMMON.getParameter('api_get_bodymeter');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, personal))
        .done(function (data, textStatus, jqXHR) {
          //ローディング完了
          SERVICE_COMMON.loading_comp();
          if (data['result'] == '0') {
            var bodyData = data['data']['bodyData'];
            //詳細表示用に退避しておく
            $scope.bodyData = bodyData;
            var measurement_data = Enumerable.from(bodyData)
              .select("x => {\
              measurement_date:x.measurement_date,\
              weight:Enumerable.from(x.measurement_data).where(y => y.header_name == 'Wk').select('y => {name:y.header_name_ja, value:y.value+y.unit}').first(),\
              fat:Enumerable.from(x.measurement_data).where(y => y.header_name == 'FW').select('y => {name:y.header_name_ja, value:y.value+y.unit}').first(),\
              bmi:Enumerable.from(x.measurement_data).where(y => y.header_name == 'MI').select('y => {name:y.header_name_ja, value:y.value+y.unit}').first(),\
              }").toArray();
            //一覧に表示
            $scope.meterResults = measurement_data;
          } else{
            SERVICE_COMMON.toast(data['msg']);
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log(JSON.stringify(jqXHR));
          //ローディング完了
          SERVICE_COMMON.loading_comp();
        });
    }

    //詳細データをポップアップ
    $scope.popDetail = function (measurement_date) {
      var meterResults = $scope.bodyData;
      meterResults = Enumerable.from(meterResults).where(x => x.measurement_date == measurement_date).select(x => x.measurement_data).first();
      meterResults = Enumerable.from(meterResults).where(x => x.output_flg == "1").toArray();
      $scope.measurement_date = measurement_date;
      $scope.details = meterResults;
      $('#popDetail').show();
    }
    $scope.popClose = function () {
      $('#popDetail').hide();
    }

    //データの削除
    $scope.dataDelete = function () {
      //ポップアップ表示
      var myPopup = $ionicPopup.show({
        template: '測定データを削除します。データを削除すると元には戻せません。<br>よろしいですか？',
        title: '削除確認',
        subTitle: '',
        scope: $scope,
        buttons: [
          { text: '中止' }, {
            text: '<g>削除</g>',
            type: 'btn-color04',
            onTap: function (e) {
              SERVICE_COMMON.toast("削除が完了しました");

            }
          }
        ]
      });

    }

  });