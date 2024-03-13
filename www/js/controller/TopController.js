angular.module('starter.TopControllers', [])
    //トップ画面処理
    .controller('TopCtrl', function ($state, $scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {

        $scope.$on('$ionicView.enter', function () {
            //読み込み開始
            //SERVICE_COMMON.loading();
            //本日の日付を表示
            var date_now = moment().format("YYYY年M月D日 (ddd)");
            $scope.date_now = date_now;

            // //高齢・若者判定
            // if(localStorage.getItem('oldPerson') == 1){
            //     $scope.over60 = true;
            // }
            // else{
            //     $scope.over60 = false;
            // }

            //チュートリアルを通っている場合のみ通過する
            if (localStorage.getItem('Tutorial') == 0) {
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }
            console.log(localStorage.getItem('Tutorial'));

            //歩数を取得し、グラフを表示
            var datatypes = [{
                read: ['steps', 'height', 'weight'],// Read only permission 歩数、身長、体重
            }];
            navigator.health.requestAuthorization(datatypes,
                $scope.dispChart(), null
            )

            //ホームボタンタップ時に歩数の再取得を行う
            $scope.displaingchart = true;
            $("#tab-center").off("click");
            $('#tab-center').on('click', function () {
                console.log('#tab-center');
                var pagename = $state.current.name;
                console.log(pagename);
                if (pagename == 'tab.top') {
                    if (!$scope.displaingchart) {
                        $scope.displaingchart = true;
                        //歩数を取得し、グラフを表示
                        var datatypes = [{
                            read: ['steps', 'height', 'weight'],// Read only permission 歩数、身長、体重
                        }];
                        navigator.health.requestAuthorization(datatypes,
                            $scope.dispChart(), null
                        )
                    }
                }
            });

            //月によって背景画像とへしこちゃんの画像を差し替える
            var url = SERVICE_COMMON.getParameter('api_get_code_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        var month = moment().month() + 1;
                        var seasonData = Enumerable.from(data['data'])
                            .where(x => x.kubun == 1110)
                            .where(x => (parseInt(x.kanren1) <= month && parseInt(x.kanren2) >= month) ||
                                (parseInt(x.kanren1) >= parseInt(x.kanren2) && parseInt(x.kanren1) <= month) ||
                                (parseInt(x.kanren1) >= parseInt(x.kanren2) && parseInt(x.kanren2) >= month)).first();
                        //画像・ボタンを変更
                        $("#imgHeshiko").attr('src', `./img/top/${seasonData.kanren4}.svg`);
                        $("#homeContent").css('background-image', `url('./img/${seasonData.kanren3}.png')`);
                        $("#btn-point").attr('src', `./img/top/btn-point-${seasonData.kanren5}.svg`);
                        $("#btn-hosuu").attr('src', `./img/top/btn-hosuu-${seasonData.kanren5}.svg`);
                        $("#btn-stamp").attr('src', `./img/top/btn-stamp-${seasonData.kanren5}.svg`);
                        $("#btn-coupon").attr('src', `./img/top/btn-coupon-${seasonData.kanren5}.svg`);
                        $("#btn-taisosei").attr('src', `./img/top/btn-taisosei-${seasonData.kanren5}.svg`);

                        console.log("読み込み完了");

                        //お知らせのバッチ表示
                        $scope.newsBadge();

                    //高齢・若者判定
                    if(localStorage.getItem('oldPerson') == 1 && localStorage.getItem('GroupCertification') == 1){
                        $scope.over60 = true;
                        //ユーザの登録チェック
                        $scope.checkUserRegist();
                    }
                    else if(localStorage.getItem('oldPerson' == 1)){
                        //高齢者フラグon
                        $scope.over60 = true;
                    }
                    else{
                        //高齢者フラグoff
                        $scope.over60 = false;
                        //ユーザの登録チェック
                        $scope.checkUserRegist_young();
                    }

                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                    //読み込み完了
                    SERVICE_COMMON.loading_comp();
                    $scope.load_comp = true;
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });
        });

        //ユーザ情報の取得＋直近の予定
        $scope.checkUserRegist = function () {
            //SERVICE_COMMON.loading();
            var personal = JSON.parse(localStorage.getItem('Personal') || localStorage.getItem('Tutorial') == 0);
            console.log(JSON.stringify(personal)); 
            if (!SERVICE_COMMON.isset(personal)) {
                console.log(personal);
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }
            var param = { "user_id": personal['user_id'] };
            console.log(JSON.stringify(param));
            var url = SERVICE_COMMON.getParameter('api_get_user');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, param))
                .done(function (data, textStatus, jqXHR) {
                    SERVICE_COMMON.loading_comp();
                    if (data['result'] == '0') {
                        console.log(JSON.stringify(data['data']));
                        $scope.personal = data['data']['user'];
                        $scope.activities = data['data']['activity'];
                        $scope.all_activities = data['data']['all_activity'];
                        $scope.activityCount = data['data']['activity'].length;
                        $timeout(function () {
                            //ローカルストレージの内容を更新
                            localStorage.setItem('GroupCertification', 1);
                            localStorage.setItem('Tutorial', 1);
                            localStorage.setItem('Personal', JSON.stringify($scope.personal));
                            $scope.$apply();
                        });
                    } else {
                        SERVICE_COMMON.popup(data['msg']);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });
        }

        //ユーザ情報の取得＋直近の予定
        $scope.checkUserRegist_young = function () {
            //SERVICE_COMMON.loading();
            var personal = JSON.parse(localStorage.getItem('Personal'));
            console.log(JSON.stringify(personal));
            if (!SERVICE_COMMON.isset(personal)) {
                console.log(personal);
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }
            var param = { "user_id": personal['user_id'] };
            console.log(JSON.stringify(param));
            var url = SERVICE_COMMON.getParameter('api_get_user_young');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, param))
                .done(function (data, textStatus, jqXHR) {
                    SERVICE_COMMON.loading_comp();
                    if (data['result'] == '0') {
                        console.log(JSON.stringify(data['data']));
                        $scope.personal = data['data']['user'];
                        $scope.activities = data['data']['activity'];
                        $scope.all_activities = data['data']['all_activity'];
                        $scope.activityCount = data['data']['activity'].length;
                        $timeout(function () {
                            //ローカルストレージの内容を更新
                            localStorage.setItem('Tutorial', 1);
                            localStorage.setItem('Personal', JSON.stringify($scope.personal));
                            $scope.$apply();
                        });
                    } else {
                        SERVICE_COMMON.popup(data['msg']);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });
        }

        //歩数を取得し、グラフを表示する
        $scope.dispChart = function () {
            console.log('きてはいる')
            //ローディング
            SERVICE_COMMON.loading(false);

            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (!SERVICE_COMMON.isset(personal)) {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                //return false;
            }

            console.log(JSON.stringify(personal));

            //ユーザID
            var user_id = personal['user_id'];

            //最終起動日
            var last_launch = localStorage.getItem('Last_launch');
            if (!SERVICE_COMMON.isset(last_launch)) {
                last_launch = moment().format('YYYY/MM/DD');
            }

            console.log('last launch' + last_launch);

            $timeout(function () {
                //歩数情報取得
                navigator.health.queryAggregated({
                    startDate: new Date(last_launch), //前回起動日
                    endDate: new Date(), // now
                    dataType: 'steps',
                    bucket: 'day',       //hour、day、week、month、year
                    //filtered: true       //手入力歩数は除く
                }, function (data) {

                    console.log(JSON.stringify(data));

                    //ローディング完了
                    SERVICE_COMMON.loading_comp();

                    //本日の歩数
                    step = data[data.length - 1]['value'] * 1;
                    console.log('###' + step);
                    //画面に表示(少数点切り捨て（iOS対応))
                    $scope.step = Math.floor(step);
                    $scope.step_com = Math.floor(step).toLocaleString();

                    //ローカルストレージに最後の歩数を残す
                    localStorage.setItem('Last_Step', Math.floor(step));
                    //身長・体重を取得
                    var height = personal['height'];
                    var weight = personal['weight'];

                    //前回起動日までの歩数データをデータベースに登録
                    var post_data = new Object;

                    post_data['user_id'] = user_id;
                    post_data['hosu_data'] = data;
                    var url = SERVICE_COMMON.getParameter('api_reg_hosu');
                    $.ajax(SERVICE_COMMON.getAjaxOption(url, post_data))
                        .done(function (data, textStatus, jqXHR) {
                            //前回起動日の更新
                            localStorage.setItem('Last_launch', moment().format('YYYY/MM/DD'));
                        })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                            console.log(JSON.stringify(jqXHR));
                    });

                }, function (err) {
                    //ローディング完了
                    SERVICE_COMMON.loading_comp();
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(err);
                    console.log('query error :' + err);
                    //エラーだったら前回取得時の歩数を表示
                    $scope.step_com = parseInt(localStorage.getItem('Last_Step')).toLocaleString();

                });

            }, 500);

                //表示中フラグを下す
                $timeout(function () {
                    $scope.displaingchart = false;
                }, 300);

        }

        //お知らせのバッチ表示
        $scope.newsBadge = function () {
            //ローカルストレージからユーザID取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (SERVICE_COMMON.isset(personal)) {
                var user_id = personal['user_id'];
                $scope.user_id = user_id;
            }
            //TabsCtrlのスコープを取得
            var TabsCtrl = SHARE_SCOPE.getScope('TabsCtrl');
            //お知らせのバッジ表示
            //お知らせ情報取得
            var param = { "user_id": user_id };
            var url = SERVICE_COMMON.getParameter('api_get_news');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, param))
                .done(function (data, textStatus, jqXHR) {
                    SERVICE_COMMON.loading_comp();
                    if (data['result'] == '0') {
                        //一番上のお知らせの投稿日が、ローカルストレージに保持しているお知らせ最終確認日より大きければバッジを表示する。
                        var last_date = moment(localStorage.getItem('LastNewsDate')).format('YYYY/MM/DD HH:mm:ss');
                        if (data['data']['news'].length > 0) {
                            //var news_date = moment(data['data']['news'][0]['order_date']).format('YYYY/MM/DD HH:mm:ss');
                            var news_date = moment(Enumerable.from(data['data']['news']).orderByDescending(x => x.order_date).first().order_date).format('YYYY/MM/DD HH:mm:ss');
                            if (news_date > last_date) {
                                TabsCtrl.NewsCount = 1;
                            }
                        }
                        //団体認証済ユーザのみ、団体からのお知らせを確認
                        if(localStorage.getItem('GroupCertification') == 1){
                            if (data['data']['group'].length > 0) {
                                //var group_date = moment(data['data']['group'][0]['order_date']).format('YYYY/MM/DD HH:mm:ss');
                                var group_date = moment(Enumerable.from(data['data']['group']).orderByDescending(x => x.order_date).first().order_date).format('YYYY/MM/DD HH:mm:ss');
                                if (group_date > last_date) {
                                    TabsCtrl.NewsCount = 1;
                                }
                            }
                        }

                        console.log(last_date);
                        console.log(news_date);
                        console.log(group_date);

                        $scope.dispChart();

                        $timeout(function () {
                            $scope.$apply();
                        });
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });
        }

        //カメラを起動しQRを読み取る
        $scope.scanQR = function () {
            if (!$scope.scannerLounching) {
                $scope.scannerLounching = true;
                //QRから読み取ったグループ情報の確認
                cordova.plugins.barcodeScanner.scan(
                    function (data) {
                        $scope.scannerLounching = false;
                        //QRの情報を配列化
                        var qrData = JSON.parse(data.text);
                        //活動区分が団体のものか町からのものか判定
                        if (qrData.activity_kbn == 91 || qrData.activity_kbn == 92 || qrData.activity_kbn == 93 || qrData.activity_kbn == 94 || qrData.activity_kbn == 95 || qrData.activity_kbn == 96 || qrData.activity_kbn == 97 || qrData.activity_kbn == 1 || qrData.activity_kbn == 2) {
                            var townActivity = [];
                            var date = moment().format("YYYY/MM/DD");
                            //町-地域貢献活動
                            if (qrData.activity_kbn == 91) {
                                townActivity = Enumerable.from($scope.all_activities).where(x => x.activity_kbn == 91 && x.start_date == date).toArray();
                            }
                            //町-健康づくり活動
                            if (qrData.activity_kbn == 92) {
                                townActivity = Enumerable.from($scope.all_activities).where(x => x.activity_kbn == 92 && x.start_date == date).toArray();
                            }
                            //団体-健康づくり活動
                            if (qrData.activity_kbn == 1) {
                                townActivity = Enumerable.from($scope.all_activities).where(x => x.activity_kbn == 1 && x.start_date == date).toArray();
                            }
                            //団体-地域貢献活動
                            if (qrData.activity_kbn == 2) {
                                townActivity = Enumerable.from($scope.all_activities).where(x => x.activity_kbn == 2 && x.start_date == date).toArray();
                            }
                            //げんげん弁当
                            if(qrData.activity_kbn == 93) {
                                $scope.GivePoint(23,'gengen');
                                $timeout(function () {
                                    SERVICE_COMMON.loading();
                                    $scope.$apply();
                                }, 1000);
                                SERVICE_COMMON.loading_comp();
                                SERVICE_COMMON.MovePage('#/tab/point/');
                                return false;
                            }
                            //イベントQR（１０ポイント）
                            if(qrData.activity_kbn == 94) {
                                $scope.GivePoint(31,'eventqr');
                                $timeout(function () {
                                    SERVICE_COMMON.loading();
                                    $scope.$apply();
                                }, 1000);
                                SERVICE_COMMON.loading_comp();
                                SERVICE_COMMON.MovePage('#/tab/point/');
                                return false;
                            }
                            //イベントQR（３０ポイント）
                            if(qrData.activity_kbn == 95) {
                                $scope.GivePoint(32,'eventqr');
                                $timeout(function () {
                                    SERVICE_COMMON.loading();
                                    $scope.$apply();
                                }, 1000);
                                SERVICE_COMMON.loading_comp();
                                SERVICE_COMMON.MovePage('#/tab/point/');
                                return false;
                            }
                            //イベントQR（５０ポイント）
                            if(qrData.activity_kbn == 96) {
                                $scope.GivePoint(33,'eventqr');
                                $timeout(function () {
                                    SERVICE_COMMON.loading();
                                    $scope.$apply();
                                }, 1000);
                                SERVICE_COMMON.loading_comp();
                                SERVICE_COMMON.MovePage('#/tab/point/');
                                return false;
                            }
                            //イベントQR（１００ポイント）
                            if(qrData.activity_kbn == 97) {
                                $scope.GivePoint(34,'eventqr');
                                $timeout(function () {
                                    SERVICE_COMMON.loading();
                                    $scope.$apply();
                                }, 1000);
                                SERVICE_COMMON.loading_comp();
                                SERVICE_COMMON.MovePage('#/tab/point/');
                                return false;
                            }
                            //複数件ある場合、活動を選択                            
                            if (townActivity.length > 0) {
                                //選択画面を表示
                                console.log(JSON.stringify(townActivity));
                                $scope.townActivities = townActivity;
                                $("#qr-activity-pop-frame").fadeToggle(250);
                                $timeout(function () { $scope.$apply(); }, 300);
                            } else {
                                SERVICE_COMMON.popup('参加予定の活動はありません');
                            }
                        } else {
                            //スタンプ獲得APIをキック
                            $scope.regStamp(qrData);
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
        //ポップアップー活動選択
        $scope.popSelectActivity = function (activity_id) {
            var act = Enumerable.from($scope.townActivities).where(x => x.activity_id = activity_id).first();
            var param = { "activity_id": act.activity_id, "activity_kbn": act.activity_kbn, "stamp_date": act.start_date };
            //スタンプ獲得APIをキック
            $scope.regStamp(param);
        }
        //ポップアップ非表示
        $scope.popClose = function () {
            $("#qr-activity-pop-frame").fadeToggle(250);
        }

        //スタンプ獲得
        $scope.regStamp = function (param) {
            //SERVICE_COMMON.loading();
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (!SERVICE_COMMON.isset(personal)) {
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }
            param.user_id = personal['user_id'];
            console.log(JSON.stringify(param));
            var url = SERVICE_COMMON.getParameter('api_reg_stamp');
            console.log(JSON.stringify(param));
            $.ajax(SERVICE_COMMON.getAjaxOption(url, param))
                .done(function (data, textStatus, jqXHR) {
                    console.log(JSON.stringify(data));
                    if (data['result'] == '0') {
                        //活動の場合、ポップアップを閉じる
                        if (param.activity_kbn == 91 || param.activity_kbn == 92 || param.activity_kbn == 1 || param.activity_kbn == 2) {
                            $("#qr-activity-pop-frame").fadeToggle(250);
                        }
                        //ポイント数を更新
                        SERVICE_COMMON.popup(data['msg']);
                        console.log(JSON.stringify(data));
                        $scope.personal = data['data']['user'];
                        $scope.activities = data['data']['activity'];
                        $scope.all_activities = data['data']['all_activity'];
                        $scope.activityCount = data['data']['activity'].length;
                        $timeout(function () {
                            $scope.$apply();
                        });
                    } else {
                        SERVICE_COMMON.popup(data['msg']);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    console.log(JSON.stringify(jqXHR));
                });
        }

        //ポイント履歴へ遷移
        $scope.movePoint = function () {
            SERVICE_COMMON.MovePage('#/tab/point/');
        }

        //体組成連携へ移動
        $scope.moveBodyMeter = function () {
            SERVICE_COMMON.MovePage('#/tab/bodymeter/');
        }

        //メニューへ移動
        $scope.MoveMenu = function (page) {
            location.href = page;
        }

    //ポイント獲得ボタン（げんげん弁当）
    $scope.GivePoint = function (challenge_id,challenge_type) {
        //個人設定を取得
        var personal = JSON.parse(localStorage.getItem('Personal'));
        if (SERVICE_COMMON.isset(personal)) {
            user_id = personal['user_id'];
        } else {
            SERVICE_COMMON.toast('個人設定が登録されていないためポイント獲得ができません。');
            return false;
        }
        //クリア-ポイント付与
        var url = SERVICE_COMMON.getParameter('api_reg_givepoint');
        var data = {};
        data['user_id'] = user_id;
        data['challenge_type'] = challenge_type;
        data['challenge_id'] = challenge_id;
        console.log(JSON.stringify(data));
        $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
            .done(function (data, textStatus, jqXHR) {
                console.log(JSON.stringify(data));
                if (data['result'] == '0') {
                    SERVICE_COMMON.toast('ポイントを獲得しました');
                } else if (data['result'] == '1') {
                    SERVICE_COMMON.toast('すでにポイント獲得済みです');
                } else {
                    SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                //エラーログ出力
                SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                console.log(JSON.stringify(jqXHR));
            });
    }

    })