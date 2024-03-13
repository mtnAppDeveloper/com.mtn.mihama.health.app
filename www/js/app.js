// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
var myApp = angular.module('starter', [
  'ionic',
  'starter.controllers',
  'starter.TopControllers',
  'starter.NewsControllers',
  'starter.ActivityControllers',
  'starter.GrafControllers',
  'starter.PointControllers',
  'starter.GroupUserControllers', 
  'starter.GroupActivityControllers', 
  'starter.HealthControllers',
  'starter.CheckListControllers',
  'starter.CouponControllers',
  'starter.BodyMeterControllers',
  'starter.GroupControllers',
  'starter.PersonalControllers',
  'starter.BrainTrainingControllers',
  'starter.services'])
myApp.config(function ($ionicConfigProvider) {
  $ionicConfigProvider.backButton.previousTitleText(false);
  $ionicConfigProvider.backButton.text(null);
});
myApp.config(['$compileProvider', function($compileProvider) { 
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|s?ftp|mailto|tel|file|monaca-app|monaca-debugger):/);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|s?ftp|mailto|tel|file|monaca-app|monaca-debugger):/);
}]);
myApp.run(function ($ionicPlatform, $ionicHistory, $ionicLoading, $timeout, $state, $rootScope,SERVICE_COMMON) {
  $ionicPlatform.ready(function () {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
      cordova.plugins.Keyboard.disableScroll(true);
      cordova.plugins.Keyboard.hideFormAccessoryBar(false);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      //StatusBar.styleDefault(); iOS only?
    }
  });
  // androidの戻るキーを無効化
  $ionicPlatform.registerBackButtonAction(function (event) {
    //LocalStratogeに画面名を保存
    var pagename = $state.current.name;
    var isScanBarcode = localStorage.getItem('isScanBarcode');
    localStorage.setItem("history_page", pagename);
      $ionicHistory.goBack();
  });
})


  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $ionicConfigProvider.tabs.position('bottom');
    $stateProvider

      // setup an abstract state for the tabs directive
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html'
      })

      /*****************
      * TOPタブ
      *****************/
      //TOPページ
      .state('tab.top', {
        url: '/top/',
        views: {
          'tab-top': {
            templateUrl: 'templates/tab-top.html',
            controller: ''
          }
        }
      })
     /*****************
      * NEWSタブ
      *****************/
      //一覧ページ
      .state('tab.news', {
        url: '/news/',
        views: {
          'tab-news': {
            templateUrl: 'templates/tab-news.html',
            controller: 'NewsCtrl'
          }
        }
      })
      //詳細ページ
      .state('tab.news_detail', {
        url: '/news/detail/',
        views: {
          'tab-news': {
            templateUrl: 'templates/tab-news_detail.html',
            controller: 'NewsDetailCtrl'
          }
        }
      })
      /*****************
      * 活動タブ
      *****************/
      //一覧ページ
      .state('tab.activity', {
        url: '/activity/',
        views: {
          'tab-activity': {
            templateUrl: 'templates/tab-activity.html',
            controller: ''
          }
        }
      })
      /*****************
      * グラフタブ
      *****************/
      //一覧ページ
      .state('tab.graf', {
        url: '/graf/',
        views: {
          'tab-graf': {
            templateUrl: 'templates/tab-graf.html',
            controller: 'GrafCtrl'
          }
        }
      })
      /*****************
      * ポイントタブ
      *****************/
      //一覧ページ
      .state('tab.point', {
        url: '/point/',
        views: {
          'tab-point': {
            templateUrl: 'templates/tab-point.html',
            controller: 'PointCtrl'
          }
        }
      })
      //交換ページ
      .state('tab.point_exchange', {
        url: '/point/exchange/',
        views: {
          'tab-point': {
            templateUrl: 'templates/tab-point_exchange.html',
            controller: 'ExchangePointCtrl'
          }
        }
      })
      /*****************
      * グループタブ
      *****************/
      //一覧ページ
      .state('tab.group_user', {
        url: '/group_user/',
        views: {
          'tab-group_user': {
            templateUrl: 'templates/tab-group_user.html',
            controller: 'GroupUserCtrl'
          }
        }
      })
      //グループ メンバー一覧
      .state('tab.group_user-member', {
        url: '/group_user/member/',
        views: {
          'tab-group_user': {
            templateUrl: 'templates/tab-group_user_member.html',
            controller: ''
          }
        }
      })
      /*****************
      * 活動実績タブ
      *****************/
      //一覧ページ
      .state('tab.group_activity', {
        url: '/group_activity/',
        views: {
          'tab-group_activity': {
            templateUrl: 'templates/tab-group_activity.html',
            controller: 'GroupActivityCtrl'
          }
        }
      })
      //グループ メンバー一覧
      .state('tab.group_activity-list', {
        url: '/group_activity/list/',
        views: {
          'tab-group_activity': {
            templateUrl: 'templates/tab-group_activity_list.html',
            controller: ''
          }
        }
      })
      /*****************
      * 健康診断タブ
      *****************/
      //一覧ページ
      .state('tab.health', {
        url: '/health/',
        views: {
          'tab-health': {
            templateUrl: 'templates/tab-health.html',
            controller: ''
          }
        }
      })
      /*****************
      * 基本チェックリストタブ
      *****************/
      //一覧ページ
      .state('tab.checklist', {
        url: '/checklist/',
        views: {
          'tab-checklist': {
            templateUrl: 'templates/tab-checklist.html',
            controller: 'CheckListCtrl'
          }
        }
      })
      /*****************
      * クーポン
      *****************/
      //一覧ページ
      .state('tab.coupon', {
        url: '/coupon/',
        views: {
          'tab-coupon': {
            templateUrl: 'templates/tab-coupon.html',
            controller: 'CouponCtrl'
          }
        }
      })
      //クーポンページ
      .state('tab.coupon_use', {
        url: '/coupon/coupon_use/',
        views: {
          'tab-coupon': {
            templateUrl: 'templates/tab-coupon_use.html',
            controller: 'CouponUseCtrl'
          }
        }
      })
      /*****************
      * 体組成連携
      *****************/
    //   体組成連携ページ
      .state('tab.bodymeter', {
        url: '/bodymeter/',
        views: {
          'tab-bodymeter': {
            templateUrl: 'templates/tab-bodymeter.html',
            controller: 'BodyMeterCtrl'
          }
        }
      })
    //体組成測定一覧
    .state('tab.bodymeter_list', {
        url: '/bodymeter/bodymeter_list/',
        views: {
        'tab-bodymeter': {
            templateUrl: 'templates/tab-bodymeter_list.html',
            controller: 'BodyMeterListCtrl'
        }
        }
    })
      /*****************
      * グループ
      *****************/
      //団体参加
      .state('tab.group', {
        url: '/group/',
        views: {
          'tab-group': {
            templateUrl: 'templates/tab-group.html',
            controller: 'GroupCtrl'
          }
        }
      })
      //本人確認
      .state('tab.group_cert', {
        url: '/group/cert/',
        views: {
          'tab-group': {
            templateUrl: 'templates/tab-group_certification.html',
            controller: 'GroupCertCtrl'
          }
        }
      })
      //機種変更
      .state('tab.model_change', {
        url: '/group/model_change/',
        views: {
          'tab-group': {
            templateUrl: 'templates/tab-model_change.html',
            controller: 'GroupCertCtrl'
          }
        }
      })
      /*****************
      * よくある質問
      *****************/
      //質問
      .state('tab.question', {
        url: '/question/',
        views: {
          'tab-question': {
            templateUrl: 'templates/menu-question.html',
            controller: 'AbtAppCtrl'
          }
        }
      })
      /*****************
      * 脳トレ
      *****************/
      //脳トレ一覧
      .state('tab.btraining', {
        url: '/btraining/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-b_training.html',
            controller: 'BTrainingCtrl'
          }
        }
      })
       //パズル
      .state('tab.btraining-puzzle', {
        url: '/btraining/puzzle/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_puzzle.html',
            controller: 'PuzzleCtrl'
          }
        }
      })
       //計算
      .state('tab.btraining-calc', {
        url: '/btraining/calc/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_calc.html',
            controller: 'CalcCtrl'
          }
        }
      })
       //漢字
      .state('tab.btraining-kanji', {
        url: '/btraining/kanji/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_kanji.html',
            controller: 'KanjiCtrl'
          }
        }
      })
       //間違い探し
      .state('tab.btraining-diffsearch', {
        url: '/btraining/diffsearch/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_diffsearch.html',
            controller: 'DiffSearchCtrl'
          }
        }
      })
       //間違い探し（文字色）
      .state('tab.btraining-diffcolor', {
        url: '/btraining/diffcolor/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_diffcolor.html',
            controller: 'DiffSearchCtrl'
          }
        }
      })
       //暗記
      .state('tab.btraining-anki', {
        url: '/btraining/anki/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_anki.html',
            controller: 'AnkiCtrl'
          }
        }
      })
       //じゃんけん
      .state('tab.btraining-janken', {
        url: '/btraining/janken/',
        views: {
          'tab-btraining': {
            templateUrl: 'templates/tab-notore_janken.html',
            controller: 'JankenCtrl'
          }
        }
      })
      //チュートリアル
        //チュートリアル
        .state('tab.tutorial', {
            url: '/tutorial/',
            views: {
            'tab-tutorial': {
                templateUrl: 'templates/tab-tutorial.html',
                controller: 'TutorialCtrl'
            }
            }
        })
      /*****************
      * 個人設定
      *****************/
      //個人設定
      .state('tab.personal', {
        url: '/personal/',
        views: {
          'tab-personal': {
            templateUrl: 'templates/tab-personal.html',
            controller: 'PersonalCtrl'
          }
        }
      })
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/top/');

  });
