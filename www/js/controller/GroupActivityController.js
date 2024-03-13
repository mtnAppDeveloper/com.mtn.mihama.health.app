angular.module('starter.GroupActivityControllers', [])

  .controller('GroupActivityCtrl', function ($scope, $timeout, $stateParams, $ionicLoading, $ionicPopup, SERVICE_COMMON, SHARE_DATA) {

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

    //活動実績一覧へ
    $scope.moveActivityList = function (group_id) {
      var ListData = $scope.groups;
      //対象データを取得
      var result = $.grep(ListData,
        function (obj, idx) {
          return (obj.group_id == group_id);   //引数のgroup_idに一致するデータを取得
        }
      );
      //共有コントローラへ渡す
      SHARE_DATA.setData('Group', result);
      //詳細画面へ遷移
      SERVICE_COMMON.MovePage('#/tab/group_activity/list/');
    }
  })
  .controller('GroupActivityListCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, SERVICE_COMMON, SHARE_DATA) {

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
      var url = SERVICE_COMMON.getParameter('api_get_group_activity');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
        .done(function (data, textStatus, jqXHR) {
          $scope.lists = data['title'];

          var activityItems = data['data'];
          $scope.lists.forEach(item =>{
              item.activityItems = Enumerable.from(activityItems).where(x => x.id == item.id).toArray();
          })

          console.log(JSON.stringify($scope.lists));
          $scope.$apply();
          //ロード完了
          SERVICE_COMMON.loading_comp();
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log(JSON.stringify(jqXHR));
        });
    }
  });