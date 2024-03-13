angular.module('starter.CheckListControllers', [])
    //基本チェックリスト表示
    .controller('CheckListCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {

        //初期処理
        $scope.$on('$ionicView.enter', function () {

            // //ローディング開始
            SERVICE_COMMON.loading();

            //viewの更新
            $timeout(function () {
                $scope.$apply();
            }, 1000);

            // //ローディング完了
            SERVICE_COMMON.loading_comp();

            //ローカルストレージからユーザID取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (SERVICE_COMMON.isset(personal) || localStorage.getItem('Tutorial') == 0) {
                var user_id = personal['user_id'];
                $scope.user_id = user_id;
            } else {
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }

            //初期表示(健康診断API取得)
            var postData = new Object;
            postData['user_id'] = user_id;

            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_checklist_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        $scope.checklists = data['data'];
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                    }
                })
        });

        $scope.changeFlg = function (checklist) {

            //ローデング開始
            SERVICE_COMMON.loading();

            //トグルボタン押下時にフラグ変更
            if (checklist['flg'] == 1) {
                checklist['flg'] = 0;
            }
            else {
                checklist['flg'] = 1;
            }
            
            //viewの更新
            $timeout(function () {
                $scope.$apply();
            }, 10000);
            SERVICE_COMMON.loading_comp();
        }

        $scope.regChecklist = function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (!SERVICE_COMMON.isset(personal)) {
                SERVICE_COMMON.popup('個人設定が未登録のためデータの登録ができません');
                return false;
            }

            //オン状態になっているトグルボタンのIDを取得する
            checklists_data = Enumerable.from($scope.checklists).toArray();
            checklists_ids = Enumerable.from(checklists_data).select(x => x.checklist_id).toArray();
            checklists_flags = Enumerable.from(checklists_data).select(x => x.flg).toArray();

            //チェックリストIDとフラグで配列作成
            var checklists_id_flag = new Object;
            for (var i = 0; i < checklists_ids.length; i++) {
                checklists_id_flag[i] = { "checklist_id": checklists_ids[i], "flg": checklists_flags[i] }
            }

            //API用データ作成
            var postData = new Object;
            postData['user_id'] = personal['user_id'];
            postData['checklist'] = checklists_id_flag;
            //チェックリスト登録API起動
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_reg_checklist');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //viewの更新
                        $timeout(function () {
                            $scope.$apply();
                        }, 1000);
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                        SERVICE_COMMON.checklistpopup(data['msg_check']);
                        $scope.GivePoint(24);
                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                })
        }

        //ポイント獲得（チェックリスト）
        $scope.GivePoint = function (challenge_id) {
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
            data['challenge_type'] = 'checklist';
            data['challenge_id'] = challenge_id;
            console.log(JSON.stringify(data));
            $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        SERVICE_COMMON.toast('ポイントを獲得しました');
                    } else if (data['result'] == '1') {
                        // SERVICE_COMMON.toast('すでにポイント獲得済みです');
                    } else {
                        SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                });
        }

    })