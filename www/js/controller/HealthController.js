angular.module('starter.HealthControllers', [])
  //グラフ画面処理
  .controller('HealthCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {

    //初期処理
    $scope.$on('$ionicView.enter', function () {

      //ローディング開始
      SERVICE_COMMON.loading();

      //viewの更新
      $timeout(function () {
        $scope.$apply();
      }, 1000);

      //ローディング完了
      SERVICE_COMMON.loading_comp();

      //ポップアップ内受診日ドロップダウン 
      //年の作成
      var medicalY = [];
      var moment_year = moment().year();
      var moment_mont = moment().format("M");
      if (4 <= moment_mont) {
        medicalY.push(moment_year + 1);
        medicalY.push(moment_year);
      }
      else {
        medicalY.push(moment_year);
        medicalY.push(moment_year - 1);
      }
      $scope.ddl_medicalY = medicalY;
 
      //月の作成
      var medicalM = [];
      for (var m = 1; m <= 12; m++) {
        medicalM.push(m);
      }
      $scope.ddl_medicalM = medicalM;

        //チュートリアルを通っている場合のみ通過する
        if (localStorage.getItem('Tutorial') == 0) {
            SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
            return false;
        }

      //ローカルストレージからユーザID取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (SERVICE_COMMON.isset(personal) || localStorage.getItem('Tutorial') == 0) {
        var user_id = personal['user_id'];
        $scope.user_id = user_id;
      }else{
        SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
        return false;
      }

      //初期表示(健康診断API取得)
      var postData = new Object;
      postData['user_id'] = user_id;

      SERVICE_COMMON.loading();
      var url = SERVICE_COMMON.getParameter('api_get_medical_mst');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
        .done(function (data, textStatus, jqXHR) {
          if (data['result'] == '0') {
            $scope.items = data['data'];
            $scope.items_sonota = data['data'];
            //ローディング完了
            SERVICE_COMMON.loading_comp();
          } else {
            SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
          }
        })

      //集団検診データ取得
      SERVICE_COMMON.loading();
      url = SERVICE_COMMON.getParameter('api_get_group_medical');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
        .done(function (data, textStatus, jqXHR) {
          if (data['result'] == '0') {
            $scope.g_medicals = data['data'];
            // console.log(JSON.stringify($scope.g_medicals));
            //ローディング完了
            SERVICE_COMMON.loading_comp();
          } else {
            SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
          }
        })

    });

    //年、月が変更された場合に日付を取得
      $scope.setDate = function (day) {
        //日の作成
        var medicalD = [];
        var year = $('#medical_y option:selected').val();
        var month = $('#medical_m option:selected').val();

        //配列初期化
        medicalD.length = 0;
        if (year !== '' && month !== '') {
          //最終日取得
          var lastDay = moment(`${year}/${month}/01`).daysInMonth();
          for (i = 1; i <= lastDay; i++) {
            medicalD.push(i);
          }
        }

        //設定
        $scope.ddl_medicalD = medicalD;
        $timeout(function(){
          $scope.$apply();
          $('#medical_d').val(day);
        })
      }

        //詳細ポップアップ(個別)
        $scope.popDescription = function (medical_id, title, medical_date, medical_place) {
            //ポップアップを表示
            $timeout(function () { $scope.$apply(); });
            $("#challenge-pop-frame").fadeToggle(250);

            //初期値設定
            $('#medical_y').val(moment().year());
            $('#medical_m').val(moment().format("M"));
            $scope.setDate(moment().format("D"));
            $('#medical_place').val('');
        
            //ポップアップに健康診断情報入力
            $scope.popMedical = { "medical_id": medical_id, "title": title, "medical_date": medical_date, "medical_place": medical_place };
            //個別フラグon
            $scope.kobetsu = true;
        }

        //詳細ポップアップ(集団)
        $scope.popDescription_Group = function (medical_id, title, medical_date, medical_place) {
            //ポップアップを表示
            $timeout(function () { $scope.$apply(); });
            $("#challenge-pop-frame").fadeToggle(250);

            // console.log(JSON.stringify($scope.g_medicals));

            //初期値設定
            $('#medical_y').val(moment().year());
            $('#medical_m').val(moment().format("M"));
            $scope.setDate(moment().format("D"));
            $('#medical_place').val('');
        
            //ポップアップに健康診断情報入力
            $scope.popMedical = { "medical_id": medical_id, "title": title, "medical_date": medical_date, "medical_place": medical_place };

            //$scope.g_medicalsからmedical_idに対応するmedical_dateを全て取り出す(重複削除)
            var medical_dates = [];
            for (var i = 0; i < $scope.g_medicals.length; i++) {
                if ($scope.g_medicals[i].medical_id == medical_id) {
                    if (medical_dates.indexOf($scope.g_medicals[i].medical_date) == -1) {
                        medical_dates.push($scope.g_medicals[i].medical_date);
                    }
                }
            }
            $scope.medical_dates = medical_dates;
            //$scope.g_medicalsからmedical_idに対応するmedical_placeを全て取り出す(重複削除)
            var medical_places = [];
            for (var i = 0; i < $scope.g_medicals.length; i++) {
              if ($scope.g_medicals[i].medical_id == medical_id) {
                if (medical_places.indexOf($scope.g_medicals[i].medical_place) == -1) {
                  medical_places.push($scope.g_medicals[i].medical_place);
                }
              }
            }
            $scope.medical_places = medical_places;

            //個別フラグoff
            $scope.kobetsu = false;
        }

        //ポップアップクローズ
            $scope.popDescriptionClose = function () {
            $("#challenge-pop-frame").fadeToggle(250);
            $scope.popChartTitle = '';
            $scope.popChallengeDescription = null;
            var medical_id = $('#medical_id').val();
            $(`#groupmedical${medical_id} input`).prop('checked', false);
            $(`#medical${medical_id} input`).prop('checked', false);
        }

        //トグルボタン押下時(健康診断登録処理)
        $scope.regMedical = function () {
        //パラメータ取得
        var medical_id = $('#medical_id').val();
        var title = $('#title').val();
        var medical_y = $('#medical_y option:selected').val();
        var medical_m = $('#medical_m option:selected').val();
        var medical_d = $('#medical_d option:selected').val();
        var medical_date = medical_y + '/' + ('00' + medical_m).slice(-2) + '/' + ('00' + medical_d).slice(-2);
        var medical_place = $('#medical_place').val();
        var medical_date_group = $('#medical_date_group option:selected').val();
        var medical_place_group = $('#medical_place_group option:selected').val();


        //比較年月日作成
        var hikaku_year = moment().year();
        var today_month = moment().format("M");

        if (4 <= today_month) {
            hikaku_year = hikaku_year + '/03/31';
        }
        else {
            hikaku_year = (Number(hikaku_year) - 1) + '/03/31';
        }

        var postData ={};

        if($scope.kobetsu == true){
            if (medical_y == "" || medical_y == '? undefined:undefined ?') {
                SERVICE_COMMON.popup('受診日（年）は必ず入力してください');
                return false;
            }

            if (medical_m == "" || medical_m == '? undefined:undefined ?') {
                SERVICE_COMMON.popup('受診日（月）は必ず入力してください');
                return false;
            }

            if (medical_d == "" || medical_d == '? undefined:undefined ?') {
                SERVICE_COMMON.popup('受診日（日）は必ず入力してください');
                return false;
            }
            if (medical_date <= hikaku_year) {
                SERVICE_COMMON.popup('受診日が前年度のため登録できません');
                return false;
            }

            if (medical_place == "") {
                SERVICE_COMMON.popup('受診場所は必ず入力してください');
                return false;
            }
        postData = { "user_id": $scope.user_id, "medical_id": medical_id, "title": title, "medical_date": medical_date, "medical_place": medical_place };
        }
        else{
            if (medical_date_group == "") {
                SERVICE_COMMON.popup('受診日は必ず選択してください');
                return false;
            }
            if (medical_place_group == ""){
                SERVICE_COMMON.popup('受診場所は必ず選択してください');
                return false;
            }
        postData = { "user_id": $scope.user_id, "medical_id": medical_id, "title": title, "medical_date": medical_date_group, "medical_place": medical_place_group };
        }
        //受診記録登録API
        var url = SERVICE_COMMON.getParameter('api_reg_medical');
        SERVICE_COMMON.loading();
        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
            .done(function (data, textStatus, jqXHR) {
            if (data['result'] == '0') {
                //ポップアップを閉じる
                $("#challenge-pop-frame").fadeToggle(250);
                $scope.popChallengeDescription = null;
                //トグルボタン固定
                $(`#medical${medical_id} input`).prop('disabled', true);
                $(`#groupmedical${medical_id} input`).prop('disabled', true);
                if($scope.kobetsu == true){
                    $(`#date${medical_id}`).text('(受診日：' + medical_date + ')');
                    $(`#date${medical_id}`).removeClass('ng-hide');
                    $(`#groupdate${medical_id}`).text('(受診日：' + medical_date + ')');
                    $(`#groupdate${medical_id}`).removeClass('ng-hide');
                }else{
                    $(`#date${medical_id}`).text('(受診日：' + medical_date_group + ')');
                    $(`#date${medical_id}`).removeClass('ng-hide');
                    $(`#groupdate${medical_id}`).text('(受診日：' + medical_date_group + ')');
                    $(`#groupdate${medical_id}`).removeClass('ng-hide');
                }
                //viewの更新
                $timeout(function () {
                $scope.$apply();
                }, 1000);
                //ローディング完了
                SERVICE_COMMON.loading_comp();
                //成功メッセージ表示
                SERVICE_COMMON.popup('受診記録を登録しました。\nまた、ポイントを付与しました。');
            } else {
                SERVICE_COMMON.toast(data['msg']);
                //viewの更新
                $timeout(function () {
                $scope.$apply();
                }, 1000);
                //ローディング完了
                SERVICE_COMMON.loading_comp();
            }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                //エラーログ出力
                SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                console.log(JSON.stringify(jqXHR));
            });
        }
  })