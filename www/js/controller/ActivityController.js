angular.module('starter.ActivityControllers', [])
    //活動画面処理
    .controller('ActivityCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {

            //ポップアップ画面を閉じる
            $("#activity-pop-frame").display = "none";

            //アイコンのキャッシュ回避用
            $scope.YtoS = SERVICE_COMMON.getYtoS();

            //年の作成
            var years = [];
            var moment_year = moment().year();
            var moment_mont = moment().format("M");

            if (4 <= moment_mont) {
                years.push(moment_year + 1);
                years.push(moment_year);
            }
            else {
                years.push(moment_year);
                years.push(moment_year - 1);
            }
            //月の作成
            var months = [];
            for (var m = 1; m <= 12; m++) {
                months.push(m);
            }

            //活動追加ドロップダウンの作成
            $scope.ddl_start_dateY = years;
            $scope.ddl_start_dateM = months;

            //本日を初期値とする
            var y = moment().year();
            var m = moment().format("M");
            var d = moment().format("D");

            $scope.createDays(y, m, d);

            //時間の作成
            var hours = [];
            for (var i = 1; i <= 24; i++) {
                hours.push(('00' + i).slice(-2));
            }

            var minutes = [];
            for (var i = 0; i <= 59; i++) {
                minutes.push(('00' + i).slice(-2));
            }

            //活動時間ドロップダウンの作成
            $scope.ddl_active_timeH = hours;
            $scope.ddl_active_timeM = minutes;
            $scope.ddl_active_time_endH = hours;
            $scope.ddl_active_time_endM = minutes;

            //自治体名を表示
            $scope.kokyakuName = SERVICE_COMMON.getParameter('option_kokyaku_name');

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

            var postData = new Object;
            postData['user_id'] = user_id;

            //所属している団体の一覧を取得
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_group_user');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        $scope.groupTags = data['data'];
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.loading_comp();
                    }
                })

            //活動一覧取得
            SERVICE_COMMON.loading();
            if(localStorage.getItem('oldPerson') == 1){
                var url = SERVICE_COMMON.getParameter('api_get_activity');
            }
            else{
                //若者なら検索条件を緩くする
                var url = SERVICE_COMMON.getParameter('api_get_activity_young');
            }
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        $scope.datas = data['data'];
                        $scope.data_count = Enumerable.from(data['data']).where(x => x.stamp_date == 0).toArray().length;
                        console.log(JSON.stringify($scope.datas));
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.loading_comp();
                        SERVICE_COMMON.toast(data['msg']);
                    }
                })

            //ドロップダウンの生成(活動区分)
            var url = SERVICE_COMMON.getParameter('api_get_code_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    SERVICE_COMMON.loading_comp();
                    if (data['result'] == '0') {

                        //活動区分を取得
                        $scope.activitykbns = Enumerable.from(data['data']).where(x => x.kubun == 1060 && x.code < 90).distinct().toArray();
                        console.log(JSON.stringify($scope.activitykbns));

                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                    //ローディング完了＆$scopeの更新
                    $timeout(function () { $scope.$apply(); });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                })
        });

        //タグ選択時（町から）
        $('#sel_tag_activity').on('change', function () {
            //選択されたタグ名を取得
            var group_id = $('#sel_tag_activity').val();
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id = 0;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            }

            var postData = new Object;
            postData['user_id'] = user_id;

            //活動一覧取得
            SERVICE_COMMON.loading();
            if(localStorage.getItem('oldPerson') == 1){
                var url = SERVICE_COMMON.getParameter('api_get_activity');
            }
            else{
                var url = SERVICE_COMMON.getParameter('api_get_activity_young');
            }
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        if (group_id == 0) {
                            //tagNameが０の時は全件表示
                            $scope.datas = data['data'];
                            $scope.data_count = Enumerable.from(data['data']).where(x => x.stamp_date == 0).toArray().length;
                        } else if(group_id == 9) {
                            //町からの活動のみを検索
                            var datas = Enumerable.from(data['data']).where(x => (x.group_id == 0)).toArray();
                            $scope.data_count = Enumerable.from(datas).where(x => x.stamp_date == 0).toArray().length;
                            $scope.datas = datas;
                        } else {
                            //選択されたタグ名で検索
                            var datas = Enumerable.from(data['data']).where(x => (x.group_id == group_id)).toArray();
                            $scope.data_count = Enumerable.from(datas).where(x => x.stamp_date == 0).toArray().length;
                            $scope.datas = datas;
                        }

                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                        SERVICE_COMMON.loading_comp();
                    }
                })
            $scope.$apply();
        })

        //年月に応じた日のドロップダウン生成
        $scope.createDays = function (y, m, d = 1) {
            var days = [];
            var lastDay = moment(`${y}/${m}/01`).daysInMonth();
            for (i = 1; i <= lastDay; i++) {
                days.push(i);
            }
            $scope.ddl_start_dateD = days;
            $timeout(function () {
                $scope.$apply(function () {
                    $("#start_date_d").val(d);
                });
            }, 300);
        }

        //年月変更処理
        $scope.setDate = function () {
            var y = $("#start_date_y").val();
            var m = $("#start_date_m").val();
            $scope.createDays(y, m, 1);
        }

        //詳細ポップアップ
        $scope.popActivityDescription = function (data) {
            //ポップアップを表示
            $timeout(function () { $scope.$apply(); });
            $("#activity-pop-frame").fadeToggle(250);

            console.log(JSON.stringify(data));

            var join_users = data['join_users'].split(',');
            var join_users_icon = data['join_users_icon'].split(',');
            var users = new Object;
            for (var i = 0; i < join_users.length; i++) {
                users[i] = { "join_users": join_users[i], "join_users_icon": join_users_icon[i] };
            }

            $scope.popActivity = data;
            $scope.users = users;
        }

        //活動の修正ポップアップ
        $scope.popRegActivity = function (data) {
            //同時に開いてしまう詳細ポップアップを閉じる
            $scope.popDescriptionClose();

            //活動区分設定
            $scope.reg_activity_kbn = data['activity_kbn'];

            //活動年月日設定
            var start_ymd = data['start_ymd'].split('/');
            $scope.start_date_y = start_ymd[0];
            $scope.start_date_m = start_ymd[1].replace(/^0+/, '');
            $scope.start_date_d = start_ymd[2].replace(/^0+/, '');
            $scope.createDays(start_ymd[0], start_ymd[1].replace(/^0+/, ''), start_ymd[2].replace(/^0+/, ''));

            //活動時間設定
            var active_time = data['start_time'].split(':');
            var active_time_end = data['end_time'].split(':');

            //定員数ドロップダウンリスト、値設定
            //構成人数を取得
            var member = data['member'];

            //定員数ドロップダウンリスト設定
            // var Element = document.getElementById("number");
            // $('select#number option').remove();
            // for (var i = 1; i <= member; i++) {
            //     var option = document.createElement("option");
            //     option.value = i;
            //     option.innerText = i;
            //     Element.appendChild(option);
            // }

            //ポップアップを表示
            $timeout(function () {
                $scope.$apply(function () {
                    // $('#number').val(data['capacity']);
                    $('#active_time_h').val(active_time[0]);
                    $('#active_time_m').val(active_time[1]);
                    $('#active_time_end_h').val(active_time_end[0]);
                    $('#active_time_end_m').val(active_time_end[1]);
                });
            });
            $("#activity-reg-pop-frame").fadeToggle(250);
        }

        //スタンプ獲得ポップアップ
        $scope.popStampDescription = function (data) {
            //同時に開いてしまう詳細ポップアップを閉じる
            $("#activity-pop-frame").fadeToggle(1);
            //ポップアップを表示
            $timeout(function () { $scope.$apply(); });
            $("#stamp-pop-frame").fadeToggle(250);

            var join_users = data['join_users'].split(',');
            var join_users_icon = data['join_users_icon'].split(',');
            var users = new Object;
            for (var i = 0; i < join_users.length; i++) {
                users[i] = { "join_users": join_users[i], "join_users_icon": join_users_icon[i] };
            }

            $scope.popActivity = data;
            $scope.users = users;
        }

        //活動詳細ポップアップクローズ
        $scope.popDescriptionClose = function () {
            $("#activity-pop-frame").fadeToggle(250);
        }

        //スタンプポップアップクローズ
        $scope.popStampDescriptionClose = function () {
            $("#stamp-pop-frame").fadeToggle(250);
        }

        //活動修正アップクローズ
        $scope.popDescriptionActivityClose = function () {
            $("#activity-reg-pop-frame").fadeToggle(250);
        }

        //活動をキャンセル
        $scope.cancelActivity = function (activity_id) {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id = 0;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            }

            //キャンセル用データ作成
            activity_id = $('#activity_id').val();
            var postData = { "join_flag": 0, "user_id": user_id, "activity_id": activity_id };

            //活動参加APIで活動のキャンセル
            var url = SERVICE_COMMON.getParameter('api_reg_activity_join');
            SERVICE_COMMON.loading();
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        SERVICE_COMMON.toast(data['msg']);
                        //ポップアップを閉じる
                        $("#activity-pop-frame").fadeToggle(250);
                        //viewの更新
                        $timeout(function () {
                            $scope.$apply();
                        }, 1000);
                        //活動予定を-1
                        $scope.data_count = $scope.data_count - 1;
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                        //成功メッセージ表示
                        SERVICE_COMMON.popup('活動の参加をキャンセルしました');

                        postData = new Object;
                        postData['user_id'] = user_id;

                        //活動一覧取得
                        SERVICE_COMMON.loading();
                        var url = SERVICE_COMMON.getParameter('api_get_activity');
                        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                            .done(function (data, textStatus, jqXHR) {
                                if (data['result'] == '0') {
                                    $scope.datas = data['data'];
                                    //ローディング完了
                                    SERVICE_COMMON.loading_comp();
                                } else {
                                    $scope.datas = null;
                                    SERVICE_COMMON.loading_comp();
                                }
                            })
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
        }

        // 活動修正、削除
        $scope.regActivity = function (popActivity, delflg) {

            var reg_avtivity = function () {

                //個人設定を取得
                var personal = JSON.parse(localStorage.getItem('Personal'));
                var user_id = 0;
                if (SERVICE_COMMON.isset(personal)) {
                    user_id = personal['user_id'];
                }

                //パラメータ設定
                var data = new Object;

                var start_y = $('#start_date_y').val();
                var start_m = ('00' + $('#start_date_m').val()).slice(-2);
                var start_d = ('00' + $('#start_date_d').val()).slice(-2);

                data['user_id'] = personal['user_id'];
                data['activity_id'] = $('#activity_id').val();
                data['activity_kbn'] = $('#reg_activity_kbn').val();
                data['group_id'] = $('#group_id').val();
                data['title'] = $('#reg_title').val();
                data['place'] = $('#reg_place').val();
                data['description'] = $('#reg_description').val();
                data['start_date'] = start_y + '/' + start_m + '/' + start_d;
                data['end_date'] = start_y + '/' + start_m + '/' + start_d;
                data['start_time'] = $('#active_time_h').val() + ':' + $('#active_time_m').val();
                data['end_time'] = $('#active_time_end_h').val() + ':' + $('#active_time_end_m').val();
                data['capacity'] = 0;

                if (delflg == 1) {
                    data['del_flg'] = 1;
                }

                //活動実績登録APIを使用し、activityテーブル、avtiviji_joinテーブルを削除する
                SERVICE_COMMON.loading();
                var url = SERVICE_COMMON.getParameter('api_reg_activity');
                $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
                    .done(function (data, textStatus, jqXHR) {
                        if (data['result'] == '0') {
                            var postData = { "user_id": user_id };
                            //活動一覧取得
                            $timeout(function () {
                                var url = SERVICE_COMMON.getParameter('api_get_activity');
                                $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                                    .done(function (data, textStatus, jqXHR) {
                                        //ローディング完了
                                        SERVICE_COMMON.loading_comp();
                                        if (data['result'] == '0') {
                                            $scope.datas = data['data'];
                                            if (delflg == 1) {
                                                SERVICE_COMMON.popup('活動を削除しました。');
                                            } else {
                                                SERVICE_COMMON.popup('活動を修正しました。');
                                            }

                                            //ポップアップを閉じる
                                            $scope.popDescriptionActivityClose();
                                        } else {
                                            SERVICE_COMMON.toast(data['msg']);
                                        }
                                    })
                                $scope.$apply();
                            }, 1000);
                        } else {
                            SERVICE_COMMON.toast(data['msg']);
                            SERVICE_COMMON.loading_comp();
                        }
                    })
            }

            //必須チェック
            if ($('#reg_activity_kbn').val() == "" || $('#reg_activity_kbn').val() == '? undefined:undefined ?') {
                SERVICE_COMMON.popup('活動区分を入力してください');
                return false;
            }

            if ($('#reg_title').val() == "") {
                SERVICE_COMMON.popup('活動名を入力してください');
                return false;
            }

            if ($('#reg_description').val() == "") {
                SERVICE_COMMON.popup('活動内容を入力してください');
                return false;
            }

            if ($('#reg_place').val() == "") {
                SERVICE_COMMON.popup('活動場所を入力してください');
                return false;
            }

            if ($('#start_date_y').val() == "") {
                SERVICE_COMMON.popup('活動日（年）は必ず入力してください');
                return false;
            }

            if ($('#start_date_m').val() == "") {
                SERVICE_COMMON.popup('活動日（月）は必ず入力してください');
                return false;
            }

            if ($('#start_date_d').val() == "") {
                SERVICE_COMMON.popup('活動日（日）は必ず入力してください');
                return false;
            }

            if ($('#active_time_h').val() == "") {
                SERVICE_COMMON.popup('活動時間（時）は必ず入力してください');
                return false;
            }

            if ($('#active_time_m').val() == "") {
                SERVICE_COMMON.popup('活動時間（分）は必ず入力してください');
                return false;
            }

            if ($('#active_time_end_h').val() == "") {
                SERVICE_COMMON.popup('活動終了時間（時）は必ず入力してください');
                return false;
            }

            if ($('#active_time_end_m').val() == "") {
                SERVICE_COMMON.popup('活動終了時間（分）は必ず入力してください');
                return false;
            }

            //時間チェック
            var start_time = $('#active_time_h').val() + ':' + $('#active_time_m').val();
            var end_time = $('#active_time_end_h').val() + ':' + $('#active_time_end_m').val();
            if (start_time > end_time){
                SERVICE_COMMON.popup('開始時間は終了時間より遅く入力することはできません');
                return false;
            }

            // if ($('#number').val() == "" || $('#number').val() == '? undefined:undefined ?') {
            //     SERVICE_COMMON.popup('定員数は必ず入力してください');
            //     return false;
            // }

            //警告メッセージを表示
            SERVICE_COMMON.activitypopup(popActivity, delflg, reg_avtivity);

        }

        // スタンプ作成
        $scope.regStamp = function (popActivity) {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id = 0;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            }

            var a = function () {
                //個人設定を取得
                var personal = JSON.parse(localStorage.getItem('Personal'));
                var user_id = 0;
                if (SERVICE_COMMON.isset(personal)) {
                    user_id = personal['user_id'];
                }

                var activity_id = $('#activity_id').val()
                var group_id = $('#group_id').val()
                var activity_kbn = $('#activity_kbn').val()
                var stamp_date = popActivity['start_ymd'];

                var postData = { "activity_id": activity_id, "user_id": user_id };

                //活動実績登録APIを使用し、activityテーブルを更新する
                SERVICE_COMMON.loading();
                var url = SERVICE_COMMON.getParameter('api_reg_activity_result');
                $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                    .done(function (data, textStatus, jqXHR) {
                        if (data['result'] == '0') {
                            //ローディング完了
                            SERVICE_COMMON.loading_comp();
                        } else {
                            SERVICE_COMMON.loading_comp();
                        }
                    })

                postData = { "activity_id": activity_id, "group_id": group_id, "user_id": user_id, "stamp_date": stamp_date };
                // スタンプ獲得APIを使用し、ポイントを付与する
                SERVICE_COMMON.loading();
                var url = SERVICE_COMMON.getParameter('api_reg_stamp');
                $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                    .done(function (data, textStatus, jqXHR) {
                        if (data['result'] == '0') {
                            //ローディング完了
                            SERVICE_COMMON.loading_comp();
                        } else {
                            SERVICE_COMMON.loading_comp();
                        }
                    })

                var postData = { "user_id": user_id };
                //活動一覧取得
                $timeout(function () {
                    SERVICE_COMMON.loading();
                    var url = SERVICE_COMMON.getParameter('api_get_activity');
                    $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                        .done(function (data, textStatus, jqXHR) {
                            if (data['result'] == '0') {
                                $scope.datas = data['data'];
                                //ローディング完了
                                SERVICE_COMMON.loading_comp();
                                //viewの更新
                            } else {
                                SERVICE_COMMON.toast(data['msg']);
                                SERVICE_COMMON.loading_comp();
                            }
                        })
                    $scope.$apply();
                }, 1000);

                //グループIDと活動IDでQRコード用テキスト作成
                var qrtext = { "activity_id": activity_id, "activity_kbn": activity_kbn, "group_id": group_id, "stamp_date": stamp_date };
                //文字化け防止
                var utf8qrtext = unescape(encodeURIComponent(JSON.stringify(qrtext)));
                //QRコード表示
                SERVICE_COMMON.qrpopup(utf8qrtext);
                //ポップアップ画面を閉じる
                $("#stamp-pop-frame").fadeToggle(250);
            };

            //警告メッセージを表示⇒活動実績登録APIでテーブル更新⇒QRコード作成
            SERVICE_COMMON.popupAlert(popActivity, a);

        }

        // 実績作成警告表示
        $scope.regAlert = function (popActivity) {

        }
    });
