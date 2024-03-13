angular.module('starter.GroupUserControllers', [])

  .controller('GroupUserCtrl', function ($scope, $timeout, $stateParams, $ionicLoading, $ionicPopup, SERVICE_COMMON, SHARE_DATA) {

    //初期表示処理
    $scope.$on('$ionicView.enter', function () {

      //アイコンのキャッシュ回避用
      $scope.YtoS = SERVICE_COMMON.getYtoS();

      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (SERVICE_COMMON.isset(personal) || localStorage.getItem('Tutorial') == 0) {
        var user_id = personal['user_id'];
        $scope.user_id = user_id;
      } else {
        SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
        return false;
      }

      // //ローディング開始
      SERVICE_COMMON.loading();

      var postData = { 'user_id': user_id };
      //所属しているグループを取得
      var grp_url = SERVICE_COMMON.getParameter('api_get_group_user');
      $.ajax(SERVICE_COMMON.getAjaxOption(grp_url, postData))
        .done(function (data, textStatus, jqXHR) {
          $scope.groups = data['data'];
          $timeout(function () {
            $scope.$apply();
            //ローディング完了
            SERVICE_COMMON.loading_comp();
          });
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log(JSON.stringify(jqXHR));
        });
    });

    //メンバー一覧へ
    $scope.moveMembaerList = function (group_id) {
      var ListData = $scope.groups;
      //対象データを取得
      var result = $.grep(ListData,
        function (obj, idx) {
          return (obj.group_id == group_id);   //引数のgroup_idに一致するデータを取得
        }
      ); console.log(JSON.stringify(result));
      //共有コントローラへ渡す
      SHARE_DATA.setData('Group', result);
      //詳細画面へ遷移
      SERVICE_COMMON.MovePage('#/tab/group_user/member/');
    }
  })
  .controller('GroupUserMemberCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, SERVICE_COMMON, SHARE_DATA) {

    //初期表示処理
    $scope.$on('$ionicView.enter', function () {
      //アイコンのキャッシュ回避用
      $scope.YtoS = SERVICE_COMMON.getYtoS();

      $scope.dispMember();
    });
    $scope.dispMember = function () {
      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (SERVICE_COMMON.isset(personal)) {
        var user_id = personal['user_id'];
        $scope.user_id = user_id;
      } else {
        SERVICE_COMMON.popup('個人設定が未登録のためグループの作成・表示できません');
        return false;
      }
      //ロード開始
      SERVICE_COMMON.loading(false);
      //共有コントローラから取得
      var group = SHARE_DATA.getData('Group');
      $scope.group = group[0];
      //メンバーの抽出・表示
      var data = {};
      data['group_id'] = group[0].group_id;
      var url = SERVICE_COMMON.getParameter('api_get_group_member');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
        .done(function (data, textStatus, jqXHR) {
          $scope.members = data['data'];
          $scope.$apply();
          //ロード完了
          SERVICE_COMMON.loading_comp();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log(JSON.stringify(jqXHR));
        });
    }

    //プロフィール表示
    $scope.dispProfile = function (user_id) {
      //タップされたユーザをポップアップで表示
      var members = $scope.members;
      var memberData = Enumerable.from(members).where(x => x.user_id == user_id).toArray();
      var name = memberData[0]["name"];
      var sei = memberData[0]["sei"];
      var authority = memberData[0]['authority'];
      var certification = memberData[0]['certification'];
      var icon = memberData[0]["icon"] + `${$scope.YtoS}`;
      var profile = memberData[0]["profile"];
      SERVICE_COMMON.popup(`<div class="al-center">
                              <img ng-src="${icon}" onerror="this.src='./img/thumb-default.png';" class="w-120 h-120"/>
                            </div>
                            <div class="">
                              <label class="color-grn font-size16">氏名</label><p class="font-size18 mx-0">${name}</p>
                              <label class="color-grn font-size16">性別</label><p class="font-size18 mx-0">${sei}</p>
                              <label class="color-grn font-size16">権限</label><p class="font-size18 mx-0">${authority}</p>
                              <!--<label class="color-grn font-size16">運用方法</label><p class="font-size18" mx-0>${certification}</p>-->
                            </div>`);
    }
  });