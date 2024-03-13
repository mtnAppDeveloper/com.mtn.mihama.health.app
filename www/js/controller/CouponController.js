angular.module('starter.CouponControllers', [])
  .controller('CouponCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate,SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
    $scope.$on('$ionicView.enter', function () {
        $scope.couponCount = Enumerable.from($scope.coupons).where(x => x.status == 'available').count();

        //システム日付設定
        var today_date = moment().format('YYYY/MM/DD');
        $scope.today_date = today_date; 

        //テスト用
        //$scope.today_date = '2022/03/31';

        //ローカルストレージからユーザID取得
        var personal = JSON.parse(localStorage.getItem('Personal'));
        if (SERVICE_COMMON.isset(personal) || localStorage.getItem('Tutorial') == 0) {
            var user_id = personal['user_id'];
            $scope.user_id = user_id;
        } else {
            SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
            return false;
        }

        var postData = new Object;
        postData = {"user_id" : user_id};

        //引換券一覧取得
        // SERVICE_COMMON.loading(); 
        var url = SERVICE_COMMON.getParameter('api_get_coupon');
        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
        .done(function (data, textStatus, jqXHR) {
            if (data['result'] == '0') {
            //console.log(JSON.stringify(data));
            //引換券一覧設定
            $scope.coupons = data['data'];
            //利用可能クーポン数
            $scope.couponCount = Enumerable.from($scope.coupons).where(x => x.use_date == null && x.expire_date >= $scope.today_date).count();

            //ローディング完了 
            SERVICE_COMMON.loading_comp();
            } else {
            //エラー表示
            SERVICE_COMMON.toast(data['msg']);
            //ローディング完了 
            SERVICE_COMMON.loading_comp();
            }
        })

        //関連日付(交換期間)取得
            //システム日付設定
            var codes = new Object;
            var kikan1 = new Object;
            var kikan2 = new Object;
            var kanren3 = new Object;
            var kanren4 = new Object;
            var kanren5 = new Object;
            var today_date = moment().format('YYYY/MM/DD');
            var today_year = moment().year();
            var month = moment().format("M");
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_code_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //取得したコードマスタから区分=1080のデータを取り出す
                        codes = Enumerable.from(data['data']).where(x => x.kubun == '1080').toArray();
                        //取得したコードマスタの件数分ループ
                        for (var i = 0; i < codes.length; i++) {
                            //交換期間取得
                            if (month >= 4){
                                //システム日付が４月～１２月
                                if (codes[i]['kanren1'].substring(0,2) >= 4){
                                    //関連値１が４月～１２月の場合、システム日付の年を結合
                                    kikan1 = today_year + '/' + codes[i]['kanren1'];
                                    kikan2 = today_year + '/' + codes[i]['kanren2'];
                                    // kanren3 = today_year + '/' + codes[i]['kanren3'];
                                    // kanren5 = today_year + '/' + codes[i]['kanren5'];
                                    kanren3 = (Number(today_year)  + 1) + '/' + codes[i]['kanren3'];
                                    kanren5 = (Number(today_year)  + 1) + '/' + codes[i]['kanren5'];
                                    console.log('はいった');
                                }else{
                                    //関連値１が１月～３月の場合、システム日付の年＋１を結合
                                    kikan1 = (Number(today_year) + 1) + '/' + codes[i]['kanren1'];
                                    kikan2 = (Number(today_year)  + 1) + '/' + codes[i]['kanren2'];
                                    kanren3 = (Number(today_year)) + '/' + codes[i]['kanren3'];
                                    kanren5 = (Number(today_year)) + '/' + codes[i]['kanren5'];
                                    console.log('はいった2');
                                }
                            }else{
                                //システム日付が１月～３月
                                if (codes[i]['kanren1'].substring(0,2) >= 4){
                                    //関連値１が４月～１２月の場合、システム日付の年－１を結合
                                    kikan1 = (Number(today_year)  - 1) + '/' + codes[i]['kanren1'];
                                    kikan2 = (Number(today_year)  - 1) + '/' + codes[i]['kanren2'];
                                    kanren3 = (Number(today_year)) + '/' + codes[i]['kanren3'];
                                    kanren5 = (Number(today_year)) + '/' + codes[i]['kanren5'];
                                    console.log('はいった3');
                                }else{
                                    //関連値１が１月～３月の場合、システム日付の年を結合
                                    kikan1 = today_year + '/' + codes[i]['kanren1'];
                                    kikan2 = today_year + '/' + codes[i]['kanren2'];
                                    kanren3 = today_year + '/' + codes[i]['kanren3'];
                                    kanren5 = today_year + '/' + codes[i]['kanren5'];
                                    console.log('はいった4');
                                }
                            }
                         
                            //交換期間内か判定（kanren1とkanren2の範囲内）
                            if (kikan1 <= today_date && today_date <= kikan2) {
                                //交換期間内
                                $scope.kikan = true;

                                //有効期限の設定
                                if (month >= 4){
                                    //システム日付が４月～１２月
                                    if (codes[i]['kanren3'].substring(0,2) >= 4){
                                        //関連値３が４月～１２月の場合、システム日付の年を結合
                                        kanren3 = today_year + '/' + codes[i]['kanren3'];
                                        kanren5 = today_year + '/' + codes[i]['kanren5'];
                                        console.log('はいった');
                                    }else{
                                        //関連値３が１月～３月の場合、システム日付の年＋１を結合
                                        kanren3 = (Number(today_year)  + 1) + '/' + codes[i]['kanren3'];
                                        kanren5 = (Number(today_year)  + 1) + '/' + codes[i]['kanren5'];
                                        // kanren3 = (Number(today_year)) + '/' + codes[i]['kanren3'];
                                        // kanren5 = (Number(today_year)) + '/' + codes[i]['kanren5'];
                                        console.log('はいった2');
                                    }
                                }else{
                                    //システム日付が１月～３月
                                    if (codes[i]['kanren3'].substring(0,2) >= 4){
                                        //関連値３が４月～１２月の場合、システム日付の年－１を結合
                                        // kanren3 = (Number(today_year)  - 1) + '/' + codes[i]['kanren3'];
                                        kanren3 = (Number(today_year)) + '/' + codes[i]['kanren3'];
                                        kanren5 = (Number(today_year)) + '/' + codes[i]['kanren5'];
                                        console.log('はいった3');
                                    }else{
                                        //関連値３が１月～３月の場合、システム日付の年を結合
                                        kanren3 = today_year + '/' + codes[i]['kanren3'];
                                        kanren5 = today_year + '/' + codes[i]['kanren5'];
                                        console.log('はいった4');
                                    }
                                }

                                //前年度利用フラグを取得
                                kanren4 = codes[i]['kanren4'];
                            }
                        }
                        //表示期間設定
                        $scope.kanren3 = kanren3;
                        $scope.kanren5 = kanren5;

                        console.log(JSON.stringify(kanren3));
                        console.log(JSON.stringify(kanren5));
                        console.log(today_date);
                        console.log(month);
                        //ローディング完了 
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                        //ローディング完了 
                        SERVICE_COMMON.loading_comp();
                    }
                })

    });
    //引換券利用
    $scope.useCoupon = function(coupon){
        //カメラ起動
        if (!$scope.scannerLounching) {
        $scope.scannerLounching = true;
        //QRから読み取ったグループ情報の確認
        cordova.plugins.barcodeScanner.scan(
            function (data) {
                $scope.scannerLounching = false;
                //QRの情報を配列化
                var qrData = JSON.parse(data.text);

                //クーポンが有効なら確認画面へ遷移
                if(coupon.use_date == null && coupon.expire_date >= $scope.today_date){
                    console.log(coupon.use_date);
                    console.log(coupon.expire_date);
                    console.log($scope.today_date);
                    SHARE_DATA.setData('coupon',coupon);
                    SHARE_DATA.setData('shop',qrData);
                    SERVICE_COMMON.MovePage('#/tab/coupon/coupon_use/');
                }else{
                    SERVICE_COMMON.popup('この引換券は利用できません'); 
                }
            },
            function (error) {
                $scope.scannerLounching = false;
                alert("読み取りに失敗しました: " + error);
            },
            SERVICE_COMMON.BarcodeScanSetting('QRコードをスキャンしてください')
                );
            } else {
                console.log('Scanner is runing');
        }
    }
  })

  .controller('CouponUseCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate,SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
    $scope.$on('$ionicView.enter', function () {
      $scope.coupon = SHARE_DATA.getData('coupon');
      $scope.shop = SHARE_DATA.getData('shop');
        console.log(JSON.stringify($scope.coupon));
        //コードマスタ取得
        var url = SERVICE_COMMON.getParameter('api_get_code_mst');
        $.ajax(SERVICE_COMMON.getAjaxOption(url, null)) 
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    var codes = new Object;
                    var shops = new Object;
                    var kanren1 = '';
                    var kanren2 = '';
                    //取得したコードマスタから区分=1100のデータを取り出す
                    codes = Enumerable.from(data['data']).where(x => x.kubun == '1100').toArray();
                    //システム日付設定
                    var today_date = moment().format('YYYY/MM/DD');
                    
                    //テスト用
                    //today_date = '2022/05/01';

                    //kanren1(開始日)～kanren2(終了日)の範囲内の店舗のみ抽出
                    codes = Enumerable.from(codes).where(x => (x.kanren1 <= today_date)).toArray();
                    codes = Enumerable.from(codes).where(x => (x.kanren2 >= today_date)).toArray();

                    //ドロップダウンリストに設定
                    $scope.shops = codes;

                    //ローディング完了 
                    SERVICE_COMMON.loading_comp();
                } else {
                    SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                    //ローディング完了 
                    SERVICE_COMMON.loading_comp();
                }
            })
    });

    //引換確認ポップアップ
    $scope.popCouponDescription = function (data) {
        //ポップアップを表示
        $timeout(function () { $scope.$apply(); });
        $("#coupon-pop-frame").fadeToggle(250);
        $scope.coupon = data;
    }

    //活動詳細ポップアップクローズ
    $scope.popDescriptionClose = function () {
        $("#coupon-pop-frame").fadeToggle(250);
    }

    //引換処理
    $scope.couponExchange = function(user_id,coupon){
        if($('#shop_select option:selected').val() == ''){
            var msg = '利用店舗を選択してください。';
            SERVICE_COMMON.popup(msg);
            return false;
        }
 
        //ローカルストレージからユーザID取得
        var personal = JSON.parse(localStorage.getItem('Personal'));
        console.log(JSON.stringify(personal));
        if (SERVICE_COMMON.isset(personal)) {
        var user_id = personal['user_id'];
        var user_name = personal['name'];
        }

        //現在時刻をYYYY/MM/DD HH:MM:SS形式で取得
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var day = now.getDate();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        var now_date = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;

        var postData = new Object;
        //自動裁判id追加 2023/11/17
        var id = coupon['id'];
        var coupon_id = coupon['coupon_id'];
        var issue_date = coupon['issue_date'];
        var coupon_name = coupon['coupon_name'];
        var coupon_point = coupon['point_exchange'];
        var coupon_qtt = coupon['quantity'];
        var code = $('#shop_select option:selected').val();
        $scope.shop_name = $('#shop_select option:selected').text();
        postData = {"user_id" : user_id, "id" : id , "coupon_id" : coupon_id,
         "issue_date" : issue_date, "use_store" : code, "shop_name" : $scope.shop_name,
          "user_name" : user_name,"use_datetime" : now_date,"coupon_name" : coupon_name,
          "coupon_point" : coupon_point,"coupon_qtt" : coupon_qtt};
        
        //警告処理
        var a = function () {
        
        //クーポン利用登録
        SERVICE_COMMON.loading();
        var url = SERVICE_COMMON.getParameter('api_reg_coupon_use'); 
        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
        .done(function (data, textStatus, jqXHR) {
            if (data['result'] == '0') {
            
            var msg = '引換券を利用しました。';
            SERVICE_COMMON.popup(msg);
            SERVICE_COMMON.MovePage('#/tab/coupon/')

            //ローディング完了 
            SERVICE_COMMON.loading_comp();
            } else {
            //エラー表示
            SERVICE_COMMON.popup(data['msg']);
            //ローディング完了 
            SERVICE_COMMON.loading_comp();
            }
        })   
        }

        //警告メッセージ作成
        var msg = `${$scope.shop_name}で、<br>クーポンを使用します。<br>使用すると元には戻せませんが、よろしいですか。`;
        SERVICE_COMMON.popupPointAlert(msg, a);

    }
  });