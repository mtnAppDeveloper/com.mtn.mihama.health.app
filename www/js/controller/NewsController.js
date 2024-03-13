angular.module('starter.NewsControllers', [])
  //おしらせ画面処理
  .controller('NewsCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
    ListData = [];
    //初期表示処理
    $scope.$on('$ionicView.enter', function () {

      //TabsCtrlのスコープを取得　バッジを0に
      var now = moment().format('YYYY/MM/DD HH:mm:ss');
      localStorage.setItem('LastNewsDate', now);
      var TabsCtrl = SHARE_SCOPE.getScope('TabsCtrl');
      TabsCtrl.NewsCount = 0;

      //ユーザ登録済みフラグ
      $scope.registFlg = true;
      $scope.dispActivity();

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
        hours.push(( '00' + i ).slice( -2 ));
      }

      var minutes = [];
      for (var i = 0; i <= 59; i++) {
        minutes.push(( '00' + i ).slice( -2 ));
      }

      //活動時間ドロップダウンの作成
      $scope.ddl_active_timeH = hours;
      $scope.ddl_active_timeM = minutes;

      $scope.ddl_active_time_endH = hours;
      $scope.ddl_active_time_endM = minutes;

    })

    //年月に応じた日のドロップダウン生成
    $scope.createDays = function (y, m, d) {
      var days = [];
      var lastDay = moment(`${y}/${m}/01`).daysInMonth();
      for (i = 1; i <= lastDay; i++) {
        days.push(i);
      }
      $scope.ddl_start_dateD = days;
      $timeout(function () {
        $scope.$apply(function () {
          $('#start_date_y').val(y);
          $('#start_date_m').val(m);
          $("#start_date_d").val(d);
        });
      }, 300);
    }

    //活動区分変更時
    $scope.setNumber = function () {
      var group_id = $("#group_name").val();

      //構成人数を取得
      var data = Enumerable.from($scope.group).where(x => x.group_id == group_id).first();
      var member = data['member'];

    //   //定員数ドロップダウンリスト設定
    //   var Element = document.getElementById("number");
    //   $('select#number option').remove();
    //   for (var i = 1; i<= member; i++) {
    //     var option = document.createElement("option");
    //     option.value = i;
    //     option.innerText = i;
    //     //2022/03/04 SAKUTA ADD 最大定員数をselectedに設定
    //     if(i == member){
    //         option.selected = true;
    //     }
    //     Element.appendChild(option);
    //   }
    }

    //年月変更処理
    $scope.setDate = function () {
      var y = $("#start_date_y").val();
      var m = $("#start_date_m").val();
      $scope.createDays(y, m, 1);
    }

    $scope.dispActivity = function () {

      //自治体名を表示
      $scope.kokyakuName = SERVICE_COMMON.getParameter('option_kokyaku_name');
 
      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      $scope.stamp_manager = 1;

      user_id = 0;
      if (SERVICE_COMMON.isset(personal)) {
        user_id = personal['user_id'];
      }else{
        $scope.registFlg = false;
      }

      //ローディング開始
      SERVICE_COMMON.loading();

      //ドロップダウンの生成(団体名)
      //データ作成
      var data = new Object;
      data["user_id"] = user_id;
      
      var url = SERVICE_COMMON.getParameter('api_get_group_user');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
          .done(function (data, textStatus, jqXHR) {
            SERVICE_COMMON.loading_comp();
            if(data['result'] == '0'){

              //団体名を取得
              $scope.groupnames = data['group_data'];

              //グループ情報を保持
              $scope.group = data['group_data'];

            }
            //ローディング完了＆$scopeの更新
            $timeout(function () { $scope.$apply();});
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            console.log(JSON.stringify(jqXHR));
            SERVICE_COMMON.loading_comp();
          });

      //ドロップダウンの生成(活動区分)
      var url = SERVICE_COMMON.getParameter('api_get_code_mst');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
          .done(function (data, textStatus, jqXHR) {
            SERVICE_COMMON.loading_comp();
            if(data['result'] == '0'){

              //活動区分を取得
              $scope.activitykbns = Enumerable.from(data['data']).where(x => x.kubun == 1060 && x.code < 90).distinct().toArray();

            }else{
              SERVICE_COMMON.toast(data['msg']);
            }
            //ローディング完了＆$scopeの更新
            $timeout(function () { $scope.$apply();});
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            console.log(JSON.stringify(jqXHR));
            SERVICE_COMMON.loading_comp();
          });
      
      //お知らせ情報取得
      var url = SERVICE_COMMON.getParameter('api_get_news');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, personal))
          .done(function (data, textStatus, jqXHR) {
            SERVICE_COMMON.loading_comp();
            if(data['result'] == '0'){

              //町からのお知らせを反映
              $scope.town_newses = data['data']['news'];

              //localStorageのoldpersonが1なら若者からのお知らせを除外
              if(localStorage.getItem('oldPerson') == 1){
                $scope.town_newses = Enumerable.from($scope.town_newses).where(x => x.tag_id != 8).toArray();
              }
              if(localStorage.getItem('oldPerson') == 0){
                $scope.town_newses = Enumerable.from($scope.town_newses).where(x => x.tag_id != 7).toArray();
              }
            //   console.log(JSON.stringify(data['data']['news']));
              //タグ一覧を取得し、ドロップダウンに挿入
              $scope.town_newsTags = Enumerable.from(data['data']['news']).select(x => x.tag).distinct().toArray();
              //検索用
              $scope.town_newsTagsSearch = data['data']['news'];

              //グループからを反映
              $scope.group_newses = data['data']['group']
              //タグ一覧を取得し、ドロップダウンに挿入
              $scope.group_newsTags = Enumerable.from(data['data']['group']).select(x => x.tag).distinct().toArray();
              //検索用
              $scope.group_newsTagsSearch = data['data']['group'];

              //権限
              $scope.authority = data['authority'];
 
            }else{
              //権限
              $scope.authority = data['authority'];
              
              SERVICE_COMMON.popup(data['msg']);
            }
            //ローディング完了＆$scopeの更新
            $timeout(function () { $scope.$apply();});
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            console.log(JSON.stringify(jqXHR));
            SERVICE_COMMON.loading_comp();
          });
 
          //初期タブ
          $scope.setActiveContent('town');
    }

    //タグ選択時（町から）
    $('#sel_tag').on('change',function(){
      //選択されたタグ名を取得
      var tagName = $('#sel_tag').val();
      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      var user_id = 0;
      if (SERVICE_COMMON.isset(personal)) {
        user_id = personal['user_id'];
      }
      //tagNameが０の時は全件表示
      if(tagName == 0){
        $scope.town_newses = Enumerable.from($scope.town_newsTagsSearch).toArray();
      }else{
        //選択されたタグ名で検索
        var newses = Enumerable.from($scope.town_newsTagsSearch).where(x => (x.tag == tagName)).toArray();
        $scope.town_newses = newses;
        
      }
      
      $scope.$apply();
    })

    //タグ選択時（団体から）
    $('#group_sel_tag').on('change',function(){
      //選択されたタグ名を取得
      var tagName = $('#group_sel_tag').val();
      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      var user_id = 0;
      if (SERVICE_COMMON.isset(personal)) {
        user_id = personal['user_id'];
      }
      //tagNameが０の時は全件表示
      if(tagName == 0){
        $scope.group_newses = Enumerable.from($scope.group_newsTagsSearch).toArray();
      }else{
        //選択されたタグ名で検索
        var newses = Enumerable.from($scope.group_newsTagsSearch).where(x => (x.tag == tagName)).toArray();
        $scope.group_newses = newses;
        
      }
      
      $scope.$apply();
    })

    //お知らせ一覧クリック時
    $scope.moveNewsDetail = function (news_id,activity_id,kidoku_kbn,kbn) {
      var ListData = $scope.town_newses;

      if(kbn == 'town'){
          var ListData = $scope.town_newses;
      }else{
          var ListData = $scope.group_newses;
      }

      //ローカルストレージから既読のnews_idを取得
      var kidokuNews = JSON.parse(localStorage.getItem('kidokuNews'));
      var kidokuActivity = JSON.parse(localStorage.getItem('kidokuActivity'));
    //   console.log(kidokuActivity);
      if(kidoku_kbn == 'town'){
        
        //既読チェック
        if(kidokuNews == null){
            kidokuNews = [activity_id];
        } else {
            kidokuNews.push(activity_id);
        }
        //ローカルストレージに渡す
        localStorage.setItem('kidokuNews',JSON.stringify(kidokuNews));
      }
      else if(kidoku_kbn == 'group'){
        
        //既読チェック
        if(kidokuActivity == null){
            kidokuActivity = [activity_id]
        } else {
            kidokuActivity.push(activity_id);
        }
        //ローカルストレージに渡す
        // console.log(kidokuActivity);
        localStorage.setItem('kidokuActivity',JSON.stringify(kidokuActivity));
      }
      var news = Enumerable.from(ListData).where(x => x.news_id == news_id).first();
    //   console.log(JSON.stringify(news));
      //共有コントローラへ渡す
      SHARE_DATA.setData('NewsDetail', news);
      //詳細画面へ遷移
      SERVICE_COMMON.MovePage('#/tab/news/detail/');
    }

    //タブ切り替え時
    $scope.setActiveContent = function (kbn) {
      //ローディング開始    //2022/03/11 SAKUTA ADD
      SERVICE_COMMON.loading();
      $timeout(function(){
      if (kbn == 'town') {
        $scope.page_town = true;
        $scope.page_group = false;
      } else if (kbn == 'group') {
        $scope.page_town = false;
        $scope.page_group = true;
      }
      $scope.active_content = kbn;
      $scope.$apply();
      //ローディング完了
      SERVICE_COMMON.loading_comp();
      },500)    //2022/03/11 SAKUTA ADD
    }

    //既読チェック
    $scope.kidokuCheck = function(activity_id,kbn){
        var check = false;
        var kidokuNews = JSON.parse(localStorage.getItem('kidokuNews'));
        var kidokuActivity = JSON.parse(localStorage.getItem('kidokuActivity'));
        if(kbn == 'town'){
            check = Enumerable.from(kidokuNews).where(x => x == activity_id).any();
        } else if (kbn == 'group'){
            check = Enumerable.from(kidokuActivity).where(x => x == activity_id).any();
        }
        return check;
    }

    //活動の追加
    $scope.ActiveAdd = function(){
      //活動追加画面表示
      $('#activity-pop-frame').fadeToggle(250);
    }

    //活動の追加ポップアップを閉じる
    $scope.popActivityClose = function(){
      //活動追加画面非表示
      $('#activity-pop-frame').fadeToggle(250);
    }

    //活動登録
    $scope.CreateActivity = function(){

      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (!SERVICE_COMMON.isset(personal)){
        SERVICE_COMMON.popup('個人設定が未登録のためデータの登録がせきません');
        return false;
      }

      //必須チェック
      if ($('#group_name').val() == "" || $('#group_name').val() == '? undefined:undefined ?'){
        SERVICE_COMMON.popup('団体名を入力してください');
        return false;
      }

      if ($('#activity_kbn').val() == "" || $('#activity_kbn').val() == '? undefined:undefined ?'){
        SERVICE_COMMON.popup('活動区分を入力してください');
        return false;
      }

      if ($('#title').val() == ""){
        SERVICE_COMMON.popup('活動名を入力してください');
        return false;
      }

      if ($('#description').val() == ""){
        SERVICE_COMMON.popup('活動内容を入力してください');
        return false;
      }

      if ($('#place').val() == ""){
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
        SERVICE_COMMON.popup('活動開始時間（時）は必ず入力してください');
        return false;
      }

      if ($('#active_time_m').val() == "") {
        SERVICE_COMMON.popup('活動開始時間（分）は必ず入力してください');
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

    //   if ($('#number').val() == "" || $('#number').val() == '? undefined:undefined ?') {
    //     SERVICE_COMMON.popup('定員数は必ず入力してください');
    //     return false;
    //   }

      //データ作成
      var data = new Object;

      var start_y = $('#start_date_y').val();
      var start_m = ('00' + $('#start_date_m').val()).slice(-2);
      var start_d = ('00' + $('#start_date_d').val()).slice(-2);

      data['user_id'] = personal['user_id'];
      data['activity_kbn'] = $('#activity_kbn option:selected').val();
      data['group_id'] =$('#group_name').val();
      data['title'] = $('#title').val();
      data['place'] = $('#place').val();
      data['description'] = $('#description').val();
      data['start_date'] = start_y + '/' + start_m + '/' + start_d;
      data['end_date'] = start_y + '/' + start_m + '/' + start_d;
      data['start_time'] = $('#active_time_h').val() + ':' + $('#active_time_m').val();
      data['end_time'] = $('#active_time_end_h').val() + ':' + $('#active_time_end_m').val();
      data['capacity'] = 0;
      data['stamp'] = 1;
      data['status'] = 1;

      //ローディング開始
      SERVICE_COMMON.loading();

      //活動を登録する
      var url = SERVICE_COMMON.getParameter('api_reg_activity');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
          .done(function (data, textStatus, jqXHR) {
            SERVICE_COMMON.loading_comp();
            if(data['result'] == '0'){
              //成功メッセージ表示
              SERVICE_COMMON.popup('活動を作成しました。');
              $timeout(function () { 
                $('#group_name').val("")
                $('#activity_kbn').val("1");
                $('#title').val("");
                $('#description').val("");
                $('#place').val("");
                $scope.createDays(moment().year(), moment().format("M"), moment().format("D"));
                $('#active_time_h').val("01");
                $('#active_time_m').val("00");
                $('#active_time_end_h').val("01");
                $('#active_time_end_m').val("00");
                // $('#number').val("1");

                $scope.popActivityClose();
                $scope.dispActivity();

                $scope.$apply();
              }, 100);
            }else{
              SERVICE_COMMON.toast('活動に作成時にエラーが発生しました');
            }
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
            console.log(JSON.stringify(jqXHR));
          });
    }

  })

  //お知らせ詳細
  .controller('NewsDetailCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
    //初期表示処理
    $scope.$on('$ionicView.enter', function () {
      //一覧画面から渡されたデータを取得
      $scope.news = SHARE_DATA.getData('NewsDetail');

      //活動に既に参加しているかどうか
      if ($scope.news["kbn"] != 'town'){
        if ($scope.news["activity_join"] == 0){
          //地域貢献活動または健康づくり活動で、参加していないもの
          $scope.isAdd = true;
          $scope.isCertification = true;    //2022/03/10 SAKUTA ADD
        }else{
          //既に参加している
          $scope.isAdd = false;
          $scope.isCertification = true;    //2022/03/10 SAKUTA ADD
        }
      }
      
      //ユーザー認証されていない場合    2022/03/10 SAKUTA ADD
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if(personal == null){
          $scope.isCertification = false;
      }

      //最終お知らせ確認日を更新する
      var now = moment().format('YYYY/MM/DD HH:mm:ss');
      localStorage.setItem('LastNewsDate', now);
      var TabsCtrl = SHARE_SCOPE.getScope('TabsCtrl');
      TabsCtrl.NewsCount = 0;

      $scope.$apply();
    });

    //サイトを開く
    $scope.invokeBrowser = function (url) {
      SERVICE_COMMON.invokeBrowser(url);
    }

    //活動参加ボタン押下時
    $scope.ActiveJoin = function () {

      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));

      //データ作成
      var data = new Object;
      data['join_flg'] = 1;
      data['activity_id'] = $scope.news['activity_id'];
      data['user_id'] = personal['user_id'];

      //活動に参加する
      var url = SERVICE_COMMON.getParameter('api_reg_activity_join');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
          .done(function (data, textStatus, jqXHR) {
            SERVICE_COMMON.loading_comp();
            if(data['result'] == '0'){
              SERVICE_COMMON.popup('活動に参加しました');

              //参加済みとする
              $scope.isAdd = false;

              //2022/03/02 SAKUTA ADD タブ選択時不具合対応
              $scope.news["activity_join"] = 1;

              //ローディング完了＆$scopeの更新
              $timeout(function () { $scope.$apply();});
            }else{
              SERVICE_COMMON.toast('活動に参加時にエラーが発生しました');
            }
          })
          .fail(function (jqXHR, textStatus, errorThrown) {
            SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
            console.log(JSON.stringify(jqXHR));
          });

    }

    //ポイント獲得ボタン（コラム・アンケート）
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
        data['challenge_id'] = challenge_id;
        console.log(JSON.stringify(data));
        $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
            .done(function (data, textStatus, jqXHR) {
                if (data['result'] == '0') {
                    SERVICE_COMMON.toast('ポイントを獲得しました');
                } else if (data['result'] == '1') {
                    SERVICE_COMMON.toast('すでにポイント獲得済みです');
                } else {
                    SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
            });
    }

  })