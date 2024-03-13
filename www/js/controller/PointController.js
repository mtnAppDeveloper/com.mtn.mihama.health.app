angular.module('starter.PointControllers', [])
    //ポイント画面処理
    .controller('PointCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {

            //６０歳以上ならtrue、それ以外はfalse
            var personal = JSON.parse(localStorage.getItem('Personal'));

            //高齢・若者判定
            if(localStorage.getItem('oldPerson') == 1 && localStorage.getItem('GroupCertification') == 1){
                $scope.over60 = true;
            }
            else if(localStorage.getItem('oldPerson' == 1)){
                //高齢者フラグon
                $scope.over60 = true;
            }
            else{
                //高齢者フラグoff
                $scope.over60 = false;
            }

            //初期タブ
            $scope.setPointHistory('area');

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
            } else {
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }

            //初期表示
            var postData = new Object;
            postData['user_id'] = user_id;

            //ポイント履歴取得(高齢者向け)
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_point');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //現在のポイントを上部へ設定
                        $scope.point = data['point'];
                        //共有コントローラへ渡す
                        SHARE_DATA.setData('point', data['point']);
                        SHARE_DATA.setData('point_lastYear', data['point_lastYear']);
                        SHARE_DATA.setData('deplicateCouponCount', data['deplicateCouponCount']);
                        SHARE_DATA.setData('quantity_lastYear', data['quantity_lastYear']);

                        $scope.healths = data['data_health'];
                        $scope.areas = data['data_area'];

                        //ローディング完了 
                        SERVICE_COMMON.loading_comp();
                    } else {
                        //エラー表示
                        SERVICE_COMMON.toast(data['msg']);
                        //ローディング完了 
                        SERVICE_COMMON.loading_comp();
                    }
                })

            //ポイント履歴取得(若者向け)
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_point_hist');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    //現在のポイントを上部へ設定
                    $scope.histories = data['data'];
                    console.log(JSON.stringify(data));
                    //ローディング完了 
                    SERVICE_COMMON.loading_comp();
                } else {
                    //エラー表示
                    SERVICE_COMMON.toast(data['msg']);
                    //ローディング完了 
                    SERVICE_COMMON.loading_comp();
                }
            })

            var codes = new Object;
            var kikan1 = new Object;
            var kikan2 = new Object;
            var kanren3 = new Object;
            var kanren4 = new Object;
            var kanren5 = new Object;
            var today_date = moment().format('YYYY/MM/DD');
            var today_year = moment().year();
            var month = moment().format("M");

            //today_year = '2022';
            //today_date = '2022/10/05';
            //month = '10'; 

            //コードマスタ取得
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_code_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //取得したコードマスタから区分=1080のデータを取り出す
                        codes = Enumerable.from(data['data']).where(x => x.kubun == '1080').toArray();

                        //codesの中のkanren3を取り出し、SHARE_DATAにセット
                        var expire_date = codes[0]['kanren3'];

                        //システム日付が４月～１２月の場合、システム日付の年を結合
                        if (month >= 4){
                            expire_date = (Number(today_year) + 1) + '/' + codes[0]['kanren3'];
                        }
                        else
                        {
                            expire_date = today_year + '/' + codes[0]['kanren3'];
                        }

                         SHARE_DATA.setData('expire_date', expire_date);
                         SHARE_DATA.setData('use_zen', codes[0]['kanren4'])
                        //取得したコードマスタの件数分ループ
                        // for (var i = 0; i < codes.length; i++) {
                        //     //交換期間取得
                        //     console.log(month);
                        //     if (month >= 4){
                        //         //システム日付が４月～１２月
                        //         if (codes[i]['kanren1'].substring(0,2) >= 4){
                        //             //関連値１が４月～１２月の場合、システム日付の年を結合
                        //             kikan1 = today_year + '/' + codes[i]['kanren1'];
                        //             kikan2 = today_year + '/' + codes[i]['kanren2'];
                        //             // console.log('あ');
                        //             // console.log(codes[i]['kanren1'].substring(0,2));
                        //         }else{
                        //             //関連値１が１月～３月の場合、システム日付の年＋１を結合
                        //             kikan1 = (Number(today_year) + 1) + '/' + codes[i]['kanren1'];
                        //             kikan2 = (Number(today_year)  + 1) + '/' + codes[i]['kanren2'];
                        //             // console.log('い');
                        //             // console.log(codes[i]['kanren1'].substring(0,2));
                        //         }
                        //     }else{
                        //         //システム日付が１月～３月
                        //         if (codes[i]['kanren1'].substring(0,2) >= 4){
                        //             //関連値１が４月～１２月の場合、システム日付の年－１を結合
                        //             kikan1 = (Number(today_year)  - 1) + '/' + codes[i]['kanren1'];
                        //             kikan2 = (Number(today_year)  - 1) + '/' + codes[i]['kanren2'];
                        //         }else{
                        //             //関連値１が１月～３月の場合、システム日付の年を結合
                        //             kikan1 = today_year + '/' + codes[i]['kanren1'];
                        //             kikan2 = today_year + '/' + codes[i]['kanren2'];
                        //         }
                        //     }
                        //     //交換期間内か判定（kanren1とkanren2の範囲内）
                        //     if (kikan1 <= today_date && today_date <= kikan2) {
                        //         //交換期間内
                        //         $scope.kikan = true;

                        //         //有効期限の設定
                        //         if (month >= 4){
                        //             //システム日付が４月～１２月
                        //             if (codes[i]['kanren3'].substring(0,2) >= 4){
                        //                 //関連値３が４月～１２月の場合、システム日付の年を結合
                        //                 kanren3 = today_year + '/' + codes[i]['kanren3'];
                        //                 kanren5 = today_year + '/' + codes[i]['kanren5'];
                        //                 // console.log('はいった');
                        //             }else{
                        //                 //関連値３が１月～３月の場合、システム日付の年＋１を結合
                        //                 // kanren3 = (Number(today_year)  + 1) + '/' + codes[i]['kanren3'];
                        //                 kanren3 = (Number(today_year + 1)) + '/' + codes[i]['kanren3'];
                        //                 kanren5 = (Number(today_year + 1)) + '/' + codes[i]['kanren5'];
                        //                 // console.log('はいった2');
                        //                 // console.log(month);
                        //                 // console.log(codes[i]['kanren3'].substring(0,2));
                        //             }
                        //         }else{
                        //             //システム日付が１月～３月
                        //             if (codes[i]['kanren3'].substring(0,2) >= 4){
                        //                 //関連値３が４月～１２月の場合、システム日付の年－１を結合
                        //                 // kanren3 = (Number(today_year)  - 1) + '/' + codes[i]['kanren3'];
                        //                 kanren3 = (Number(today_year - 1)) + '/' + codes[i]['kanren3'];
                        //                 kanren5 = (Number(today_year - 1)) + '/' + codes[i]['kanren5'];
                        //                 // console.log('はいった3');
                        //             }else{
                        //                 //関連値３が１月～３月の場合、システム日付の年を結合
                        //                 kanren3 = today_year + '/' + codes[i]['kanren3'];
                        //                 kanren5 = today_year + '/' + codes[i]['kanren5'];
                        //                 // console.log('はいった4');
                        //             }
                        //         }

                        //         //前年度利用フラグを取得
                        //         kanren4 = codes[i]['kanren4'];
                        //     }
                        // }
                        //共有コントローラへ渡す
                        SHARE_DATA.setData('kikan1', kikan1);
                        SHARE_DATA.setData('kikan2', kikan2);
                        SHARE_DATA.setData('kanren3', kanren3);
                        console.log(JSON.stringify(kanren3));
                        SHARE_DATA.setData('kanren4', kanren4);
                        SHARE_DATA.setData('kanren5', kanren5);
                        SHARE_DATA.setData('kikan', $scope.kikan);

                        //ローディング完了 
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                        //ローディング完了 
                        SERVICE_COMMON.loading_comp();
                    }
                })

        });
        //タブ切り替え時
        $scope.setPointHistory = function (kbn) {
            if (kbn == 'area') {
                $scope.btn_area = true;
                $scope.btn_health = false;
            } else if (kbn == 'health') {
                $scope.btn_area = false;
                $scope.btn_health = true;
            }
            $scope.pointHistory = kbn;
        }

        //ポップアップを表示
        $scope.popDescription = function (code) {
            $('#pop-frame').fadeToggle(250);
        }       

        //ポップアップを非表示
        $scope.popDescriptionClose = function () {
            $('#pop-frame').fadeToggle(250);
        }
    })

    .controller('ExchangePointCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {

            //ローディング開始
            SERVICE_COMMON.loading();

            //システム日付設定
            var month = moment().format("M");

            //ポップアップ画面を閉じる
            $("#pointgift-pop-frame").display = "none";

            //month = '10';

            //前年度のポイントを使用する場合は前年度ポイント、それ以外は今年度ポイントを表示する
            if (SHARE_DATA.getData('kanren4') == 1) {
                $scope.turn = '前年度の';
                $scope.point = SHARE_DATA.getData('point_lastYear');
            }
            else {
                $scope.turn = '現在の'
                $scope.point = SHARE_DATA.getData('point');
            }

            //注文期間、交換期間
            $scope.kikan1 = SHARE_DATA.getData('kikan1');
            $scope.kikan2 = SHARE_DATA.getData('kikan2');
            $scope.kanren3 = SHARE_DATA.getData('kanren3');
            $scope.kanren5 = SHARE_DATA.getData('kanren5');
            $scope.expire_date = SHARE_DATA.getData('expire_date');
            $scope.use_zen = SHARE_DATA.getData('use_zen');
            console.log($scope.expire_date);
            console.log($scope.use_zen);

            //クーポン発行枚数をセット
            $scope.deplicateCouponCount = SHARE_DATA.getData('deplicateCouponCount');

            //コードマスタ取得
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_coupon_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //クーポン一覧のドロップダウンにセット
                        $scope.coupons = data['data'];
                        //ドロップダウンリスト設定
                        $timeout(function () {
                            $('#coupon').val(1);
                            $scope.changeSelectCoupon(month);
                            //ローディング完了
                            SERVICE_COMMON.loading_comp();
                        }, 100);
                    } else {
                        SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    }
                })
        })      

        //ポイント交換リスト取得
        SERVICE_COMMON.loading();
        var url = SERVICE_COMMON.getParameter('api_get_point_gift');
        $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    //現在のポイントを上部へ設定
                    console.log(JSON.stringify(data));
                    $scope.pointgift_list = data['data'];
                    //ローディング完了 
                    SERVICE_COMMON.loading_comp();
                } else {
                    //エラー表示
                    SERVICE_COMMON.toast(data['msg']);
                    //ローディング完了 
                    SERVICE_COMMON.loading_comp();
                }
            })  

        //詳細ポップアップ
        $scope.popPointGiftDescription = function (data) {
            //ポップアップを表示
            $scope.after_need_point = "";
            $timeout(function () { $scope.$apply(); });
            $("#pointgift-pop-frame").fadeToggle(250);
            //ポップアップに商品詳細を表示
            $scope.popPointGift = data;
            // $scope.title = data['title'];
            //最大交換個数を計算
            var npoint = $scope.popPointGift['point'];
            var upoint = $scope.point;
            var g_count = upoint / npoint
            var quantities = new Object;
            $('select#quantity option').remove();
            //個数をドロップダウンにセット
            for (var i = 0; i < g_count; i++) {
                quantities[i] = i + 1;
            }
            $scope.quantities = quantities;
        }

        //ポップアップ画面を閉じる
        $scope.popDescriptionClose = function () {
            $("#pointgift-pop-frame").fadeToggle(250);
        }

        //引換券利用へ遷移
        $scope.moveCoupon = function(){
        SERVICE_COMMON.MovePage('#/tab/coupon/');
        }

        //クーポン変更時に枚数、必要ポイントも同時に変更する
        $scope.changeSelectCoupon = function (month) {
            // //所持ポイント割る必要ポイントで枚数を計算する
            // //クーポンIDを取得
            // var coupon_id = $('[name=coupon_select]').val();
            // //クーポンIDから必要ポイントを取得
            // var need_point = $scope.coupons[coupon_id - 1]['need_point'];
            // //現在(前年度)のポイントを取得
            // var point = $scope.point;
            // //獲得可能枚数を算出(小数点切り捨て)
            // var leave_count = point / need_point;
            // leave_count = parseInt(leave_count, 10);

            // //ポイントの交換は100ポイントまでとする
            // //交換可能枚数を算出
            // var change_max = 100 / need_point;
            // change_max = parseInt(change_max, 10);

            // //必要ポイント数が足りなかった場合の表示
            // if (leave_count < 1) {
            //     $scope.after_need_point = 0;
            // }

            // //上限設定
            // //４月交換の場合は、９月に交換した枚数を減算した枚数を上限とする
            // if (SHARE_DATA.getData('kanren4') == 1){
            //     change_max = change_max - SHARE_DATA.getData('quantity_lastYear');          
            // }
            // if (leave_count >= change_max){
            //     leave_count = change_max;
            // }

            // var leaves = new Object;
            // $('select#leave option').remove();
            // //枚数をドロップダウンにセット
            // for (var i = 0; i < leave_count; i++) {
            //     leaves[i] = i + 1;
            // }
            // $scope.leaves = leaves;
            // //変更後の必要ポイントを計算(枚数オーバーは初期化)
            // $timeout(function () {
            //     $scope.$apply(function () {
            //         if (isNaN($('[name=leaves]').val()) == true) {
            //             $scope.after_need_point = 0;
            //         }
            //         else {
            //             $scope.after_need_point = leave_count * need_point;
            //         }
            //     }, 300)
            // });
        }

        //枚数変更時に、必要ポイントを計算・セットする
        $scope.changeSelectLeaves = function () {
            //クーポンIDを取得
            var coupon_id = $('[name=coupon_select]').val();
            //クーポンIDから必要ポイントを取得
            var need_point = $scope.coupons[coupon_id - 1]['need_point'];
            //枚数を取得
            var leaves = $('[name=leaves]').val();
            //必要ポイントを算出
            var after_need_point = need_point * leaves
            //算出後の必要ポイントをセット
            $scope.after_need_point = after_need_point;
        }

        //枚数変更時に、必要ポイントを計算・セットする
        $scope.changeSelectQuantities = function () {
            // //クーポンIDを取得
            // var coupon_id = $('[name=coupon_select]').val();
            // //クーポンIDから必要ポイントを取得
            // var need_point = $scope.coupons[coupon_id - 1]['need_point'];
            // //枚数を取得
            // var leaves = $('[name=leaves]').val();
            // //必要ポイントを算出
            // var after_need_point = need_point * leaves
            // //算出後の必要ポイントをセット
            // $scope.after_need_point = after_need_point;

            // クーポンIDを取得
            // var coupon_id = $('[name=gift_select]').val();
            var need_point = $scope.popPointGift['point'];
            var quantity = $('[name=quantity]').val();
            var after_need_point = need_point * quantity;
            $scope.after_need_point = after_need_point;
        }

        $scope.exchangePointGift = function () {
            //枚数が空欄の場合チェックを行う
            if ($('[name=quantity]').val() == '? undefined:undefined ?') {
                //ポイント不足ではなく、枚数未選択の場合
                if ($('#quantity').val() == '0ポイント') {
                    var msg = '個数を選択してください。';
                    SERVICE_COMMON.popup(msg);
                    return false;
                }
                //ポイント不足の場合
                else {
                    var msg = 'ポイントが足りないため交換できません。';
                    SERVICE_COMMON.popup(msg);
                    return false;
                }
            }
            if ($('#quantity').val() == ' 個') {
                var msg = '個数を選択してください。';
                SERVICE_COMMON.popup(msg);
                return false;
            }
            //交換
                var a = function () {
                    //画面遷移関数を渡す
                    var b = function () { SERVICE_COMMON.MovePage('#/tab/coupon/'); }
                    var postData = new Object;

                    //ローカルストレージからユーザID取得
                    var personal = JSON.parse(localStorage.getItem('Personal'));
                    if (SERVICE_COMMON.isset(personal)) {
                        var user_id = personal['user_id'];
                    }
                    //パラメータ作成
                    var point = $scope.popPointGift['point'];
                    var coupon_id = $('#gift_id').val();
                    var quantity = 1;
                    var today = new Date();
                    var expire_date = SHARE_DATA.getData('expire_date')
                    var use_zen = SHARE_DATA.getData('use_zen')
                    var point_remaining = $scope.point - $scope.popPointGift['point'];
                    var title = $('#pop_gift_name').val();

                    postData = {"user_id": user_id, "point": point, "coupon_id": coupon_id, "quantity": quantity, "expire_date": expire_date, "point_gokei": $scope.point, "point_exchange": point, "point_remaining": point_remaining, "use_zen": use_zen, "title": title };
                    console.log(JSON.stringify(postData));
                    console.log(expire_date);
                    //ポイント交換API
                    SERVICE_COMMON.loading();
                    var url = SERVICE_COMMON.getParameter('api_reg_exchange_pointgift');
                    $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                        .done(function (data, textStatus, jqXHR) {
                            if (data['result'] == '0') {
                                console.log(JSON.stringify(data));
                                //ポップアップにメッセージをセット
                                var text = '交換が完了しました。<br>クーポン券を確認してください。';
                                SERVICE_COMMON.exchangepopup(text, b);
                                //ローディング完了
                                SERVICE_COMMON.loading_comp();
                            } else {
                                console.log(JSON.stringify(data));
                                SERVICE_COMMON.popup(data['msg']);
                                SERVICE_COMMON.loading_comp();
                            }
                        })
                };

                //警告メッセージ作成
                var msg = `${$scope.after_need_point}ポイントを使用し、<br>${$('#pop_gift_name').val()}${$('#quantity option:selected').text()}を交換します。<br>交換を行うとポイントが引かれますが、よろしいですか。`;
                SERVICE_COMMON.popupPointAlert(msg, a);
        }

        // $scope.exchangePoint = function () {
        //     //枚数が空欄の場合チェックを行う
        //     if ($('[name=leaves]').val() == '? undefined:undefined ?') {
        //         //ポイント不足ではなく、枚数未選択の場合
        //         if ($('#need_point').val() == '0ポイント') {
        //             var msg = '枚数を選択してください。';
        //             SERVICE_COMMON.popup(msg);
        //             return false;
        //         }
        //         //ポイント不足の場合
        //         else {
        //             var msg = 'ポイントが足りないため交換できません。';
        //             SERVICE_COMMON.popup(msg);
        //             return false;
        //         }
        //     }
        //     if ($('#need_point').val() == ' ポイント') {
        //         var msg = '枚数を選択してください。';
        //         SERVICE_COMMON.popup(msg);
        //         return false;
        //     }
        //     //交換可能の場合
        //     if (SHARE_DATA.getData('kikan') == true) {
        //         var a = function () {
        //             //画面遷移関数を渡す
        //             var b = function () { SERVICE_COMMON.MovePage('#/tab/coupon/'); }
        //             var postData = new Object;

        //             //ローカルストレージからユーザID取得
        //             var personal = JSON.parse(localStorage.getItem('Personal'));
        //             if (SERVICE_COMMON.isset(personal)) {
        //                 var user_id = personal['user_id'];
        //             }
        //             //パラメータ作成
        //             var point = $scope.after_need_point;
        //             var coupon_id = $('[name=coupon_select]').val();
        //             var quantity = $('#leaf option:selected').text();
        //             var today = new Date();
        //             var expire_date = SHARE_DATA.getData('kanren3')
        //             var use_zen = SHARE_DATA.getData('kanren4')
        //             var point_remaining = $scope.point - $scope.after_need_point;

        //             postData = {"user_id": user_id, "point": point, "coupon_id": coupon_id, "quantity": quantity, "expire_date": expire_date, "point_gokei": $scope.point, "point_exchange": point, "point_remaining": point_remaining, "use_zen": use_zen };
        //             //ポイント交換API
        //             SERVICE_COMMON.loading();
        //             var url = SERVICE_COMMON.getParameter('api_reg_exchange_point');
        //             $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
        //                 .done(function (data, textStatus, jqXHR) {
        //                     if (data['result'] == '0') {
        //                         //console.log(JSON.stringify(data));
        //                         //ポップアップにメッセージをセット
        //                         var text = '交換が完了しました。<br>引換券を確認してください。';
        //                         SERVICE_COMMON.exchangepopup(text, b);
        //                         //ローディング完了
        //                         SERVICE_COMMON.loading_comp();
        //                     } else {
        //                         console.log(JSON.stringify(data));
        //                         SERVICE_COMMON.popup(data['msg']);
        //                         SERVICE_COMMON.loading_comp();
        //                     }
        //                 })
        //         };

        //         //警告メッセージ作成
        //         var msg = `${$scope.after_need_point}ポイントを使用し、<br>${$('#coupon option:selected').text()}${$('#leaf option:selected').text()}と交換します。<br>交換を行うとポイントが引かれますが、よろしいですか。`;
        //         SERVICE_COMMON.popupPointAlert(msg, a);
        //     }
        // }

    });