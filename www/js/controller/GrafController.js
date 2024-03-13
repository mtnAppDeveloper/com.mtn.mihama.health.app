angular.module('starter.GrafControllers', [])
  //グラフ画面処理
  .controller('GrafCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {
    $scope.$on('$ionicView.enter', function () {
      $scope.date_range = '全活動内容';
      $scope.activities = [];
      //初期表示時は週を表示
      $scope.setActiveContent('month');
    });

    //タブ切り替え時
    $scope.setActiveContent = function (kbn) {
      //グラフ切り替え   
      switch (kbn) {
        case 'month':
          //今月初と月末を取得
          var s_date = moment().startOf('month').format('YYYY/MM/DD');
          var e_date = moment().endOf('month').format('YYYY/MM/DD');
          break;

        case 'year':
          //１月から１２月を取得
          var s_date = moment().get('year') + '/01/01';
          var e_date = moment().get('year') + '/12/31';
          break;

      }
      //スコープに日付を格納
      $scope.s_date = s_date;
      $scope.e_date = e_date;
      var range = '';
      if(kbn == 'month'){
        range = moment(s_date).format('Y年M月');
      } else {
        range = moment(s_date).format('Y年')
      }
      $scope.date_range = range;
      $scope.active_content = kbn;
      getGraf();
    }

    //先月/先年の切り替え処理
    $scope.ActivePrev = function () {
      //スコープに格納している日付から先週/先月/先年を取得
      var start = moment($scope.s_date);
      var end = moment($scope.e_date);
      var bucket = $scope.active_content;

      switch (bucket) {
        case 'month':
          start = start.add(-1, "month");
          end = end.add(-1, "month").endOf('month');
          break;

        case 'year':
          start = start.add(-1, "year");
          end = end.add(-1, "year");
          break;
      }
      //フォーマット
      start = start.format('YYYY/MM/DD');
      end = end.format('YYYY/MM/DD');

      //スコープへ格納
      $scope.s_date = start;
      $scope.e_date = end;

      //日付の範囲を表示
      var range = '';
      if(bucket == 'month'){
        range = moment(start).format('Y年M月');
      } else {
        range = moment(start).format('Y年')
      }
      $scope.date_range = range;

      //データの取得・グラフ生成
      getGraf();
    }

    //次月/次年の歩数情報を取得
    $scope.ActiveNext = function () {
      //スコープに格納している日付から先週/先月/先年を取得
      var start = moment($scope.s_date);
      var end = moment($scope.e_date);
      var bucket = $scope.active_content;

      switch (bucket) {
        case 'month':
          start = start.add(1, "month");
          end = end.add(1, "month").endOf('month');
          break;

        case 'year':
          start = start.add(1, "year");
          end = end.add(1, "year");
          break;
      }
      //フォーマット
      start = start.format('YYYY/MM/DD');
      end = end.format('YYYY/MM/DD');

      //スコープへ格納
      $scope.s_date = start;
      $scope.e_date = end;

      //日付の範囲を表示
      var range = '';
      if(bucket == 'month'){
        range = moment(start).format('Y年M月');
      } else {
        range = moment(start).format('Y年')
      }
      $scope.date_range = range;

      //データの取得・グラフ生成
      getGraf();
    }

    //グラフに表示する項目の変更処理
    $scope.changeGrafType = function () {
      //データの取得・グラフ生成
      getGraf();
    }

    //グラフデータの取得
    function getGraf() {

    //表の初期化
    $scope.activities = [];

    //ローカルストレージからユーザID取得
    var personal = JSON.parse(localStorage.getItem('Personal'));
    if (SERVICE_COMMON.isset(personal)) {
        var user_id = personal['user_id'];
        $scope.user_id = user_id;
    }

    //変数定義
    $scope.grafData = [];
    var start = $scope.s_date;
    var end = $scope.e_date;
    var bucket = $scope.active_content;
    
    //ローカルストレージからユーザID取得
    var personal = JSON.parse(localStorage.getItem('Personal'));
    if (SERVICE_COMMON.isset(personal)) {
        var user_id = personal['user_id'];
        $scope.user_id = user_id;
    } else {
        SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。団体参加をしてください');
        return false;
    }

    //POSTデータ
    personal['date_from'] = start;
    personal['date_to'] = end;
    personal['date_type'] = bucket;

    var postData = new Object;
    postData = {"user_id" : user_id, "date_from" : start, "date_to" : end, "date_type" : $scope.active_content};

    console.log(JSON.stringify(postData));
//   personal['chart_type'] = chart_type;
    //グラフデータの取得
    SERVICE_COMMON.loading();
    var url = SERVICE_COMMON.getParameter('api_get_chart');
    $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
    .done(function (data, textStatus, jqXHR) {
        //ローディング完了
        SERVICE_COMMON.loading_comp();
        if (data['result'] == '0') {
        var measurementData = data['activityData'];
        var tableData = data['activityDataTable'];
        if (measurementData.length == 0) {
            SERVICE_COMMON.toast('対象データが存在しません');
            return false;
        }

        var all_sum = 0;
        var join_sum = 0;

        //表データ作成
        for(var i = 0; i < tableData.length; i++){
            all_sum += parseInt(tableData[i].allCount);
            join_sum += parseInt(tableData[i].joinCount);
            $scope.activities.push({"title" : tableData[i].title,"allCount" : tableData[i].allCount,"joinCount":tableData[i].joinCount})
        }
        //月/年の合計
        if(bucket == 'month'){
            $scope.activities.unshift({"title":"今月の活動数","allCount":all_sum,"joinCount":join_sum});
        }
        else if(bucket == 'year'){
            $scope.activities.unshift({"title":"年間の活動数","allCount":all_sum,"joinCount":join_sum});
        }

        $scope.allCount = all_sum;
        console.log(all_sum);

        //グラフ用のデータに成形し、表示
        createChart(measurementData);

        } else if (data['result'] == '9') {
        //メッセージを表示
        SERVICE_COMMON.toast(data['msg']);
        //グラフのインスタンスを2回生成するとバグるのでdestroyする
        if (SERVICE_COMMON.isset($scope.myChart)) {
            $scope.myChart.destroy();
        }
        }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        console.log(JSON.stringify(jqXHR));
        //ローディング完了
        SERVICE_COMMON.loading_comp();
    });
}

    //グラフの生成
    function createChart(measurementData) {

        //グラフに表示
        chart_type = 'general';
        if ($scope.allCount > 0) {

        //グラフ項目
        names = ['activity','all'];
        names_ja = ['参加した活動','全活動'];
        unit = ['回','回'];

        //データ部
        var grafData = [];
        var dayCount = 0;
        var xAxesFormat = '';
        //週・月データを表示
        switch ($scope.active_content) {
            case 'month': //1ヶ月分のデータ作成
            xAxesFormat = 'M/D';
            dayCount = moment($scope.s_date).endOf("month").format('D');
            break;
            case 'year': //365か月分のデータ作成
            xAxesFormat = 'M月';
            dayCount = 365;
            break;
        }
        //必要日数の配列を作成
        var daysArray = [];
        for (var i = 0; i <= dayCount - 1; i++) {
            //開始日から必要日数分の配列を作成
            var tmpDay = moment($scope.s_date).add(i, 'days').format('YYYY/MM/DD');
            daysArray.push(tmpDay);
        }

        //測定値データの配列を作成
        var chartData = [];
        names.forEach(name => {
            console.log(name);
            var d = Enumerable.from(measurementData)
            .select(
                x => Enumerable.from(x).where(y => y.header_name == name)
                .select(z => `{"date":"${z.measurement_date}" , "value":${parseFloat(z.value)}}`).firstOrDefault()
            );
            if(d.any()){
            var tmp = d.where(x=> x != null).toArray();
            if(tmp.length > 0){
                chartData.push(d.where(x=> x != null).toArray());
            }
            }
        });
        

        //グラフ用のデータを作成
        chartData.forEach(chartItem => {
            //最も古い測定データを取得（基準にする）
            var oldestValue = Enumerable.from(chartItem).where(x => x != null).select(x => JSON.parse(x).date).toArray();
            oldestValue = Enumerable.from(oldestValue).orderBy(x => x).first();

            var datas = [];
            var prevValue = oldestValue;
            daysArray.forEach(dayItem => {
            var elem = Enumerable.from(chartItem).where(x => x != null).where(x => JSON.parse(x).date == dayItem);
            //測定データが存在する場合
            if (elem.any()) {
                datas.push(JSON.parse(elem.first()).value);
                prevValue = JSON.parse(elem.first()).value;
            } else {
                //測定データが存在しないかつ,未来の日付でないもの
                if(dayItem > moment().format('YYYY/MM/DD')){
                datas.push(null);
                }else{
                datas.push(prevValue);
                }
            }
            });
            grafData.push(Enumerable.from(datas).toArray());
        });


        //X軸の作成
        var grafDate_year = [];
        var grafDate_week = Enumerable.from(daysArray).select(x => moment(x).format(xAxesFormat)).toArray();
        //年用は月始めのだけ
        var prevDay = '';
        daysArray.forEach(day =>{
            var dateYM = moment(day).format('YYYY/MM');
            if(prevDay != dateYM){
            grafDate_year.push(moment(day).format('M月'));
            prevDay = dateYM;
            }else{
            grafDate_year.push('');
            }
        });

        } else {
        //グラフ項目
        var names = Enumerable.from(measurementData)
            .select(x => Enumerable.from(x).select(y => y.header_name).firstOrDefault()).firstOrDefault();
        var names_ja = Enumerable.from(measurementData)
            .select(x => Enumerable.from(x).select(y => y.header_name_ja).firstOrDefault()).firstOrDefault();
        //単位
        var unit = Enumerable.from(measurementData)
            .select(x => Enumerable.from(x).select(y => y.unit).firstOrDefault()).toArray();
        //データ部
        grafData = Enumerable.from(measurementData)
            .select(x => Enumerable.from(x).select(y => parseFloat(y.value)).firstOrDefault()).toArray();
        //X軸のラベル
        grafDate_week = Enumerable.from(measurementData)
            .select(x => Enumerable.from(x).select(y => moment(y.measurement_date).format('M/D')).firstOrDefault()).toArray();
        //年用
        grafDate_year = Enumerable.from(measurementData)
            .select(x => Enumerable.from(x).select(y => moment(y.measurement_date).format('M月')).firstOrDefault()).toArray();
        }
        //月が重複しているので削除
        if($scope.allCount == 0){
            for(var i = 0; i < grafDate_year.length; i++){
                if(i % 2 == 0){
                    delete grafDate_year[i];
                }
            }
        }
        //グラフに表示
        bindChart(grafData, grafDate_week, grafDate_year, unit, names_ja, names);

    }

    //グラフの生成
    function bindChart(grafData, grafDate_week, grafDate_year, unit, names_ja, names) {

      //グラフのインスタンスを2回生成するとバグるのでdestroyする
      if (SERVICE_COMMON.isset($scope.myChart)) {
        $scope.myChart.destroy();
      }

      //グラフ生成前にcanvas領域の範囲を設定する（毎回必要）
      //親領域のサイズを取得
      var width = $("#chart-container").css('width').replace('px', '');
      var height = $("#chart-container").css('height').replace('px', '');
      //高さを設定
      $("#myChart0").attr('width', width);
      $("#myChart0").attr('height', height);

      //グラフのインスタンスを生成
      var ctx = $("#myChart0").get(0).getContext('2d');

      //グラフに使用するデータの定義
      var start = $scope.s_date;
      var end = $scope.e_date;
      var bucket = $scope.active_content;
      var yAxesScale = [{ "min": 0, "max": 0 }, { "min": 0, "max": 0 }];
      var stepSize = 1;
      var radius = 1;
      var borderWidth = 3;
      //年グラフの場合は点を表示しない
      if ($scope.active_content == 'year') {
        radius = 0;
        borderWidth = 1;
      }
      //複合グラフ用のプロパティ
      var grafColors = [
        { "bgColor": "#f88", "borderColor": "#f88" },
        { "bgColor": "#484", "borderColor": "#484" },
        { "bgColor": "rgba(100, 102, 250, 0.3)", "borderColor": "rgba(100, 102, 250, 0.3)" },
        { "bgColor": "rgba(100, 250, 195, 0.3)", "borderColor": "rgba(100, 250, 195, 0.3)" },
        { "bgColor": "rgba(222, 250, 100, 0.3)", "borderColor": "rgba(222, 250, 100, 0.3)" },
        { "bgColor": "rgba(250, 148, 100, 0.3)", "borderColor": "rgba(250, 148, 100, 0.3)" },
      ];

      var datasets = [];
      //Y軸右側tick表示可否
      var yAxis1DispFlg = true;
      //表示データが2件以上ある場合(複合グラフ)
      if (grafData[0].length >= 2) {
        for (var i = 0; i <= grafData.length - 1; i++) {
          //年の場合、目盛間隔を「0」とする
          if(bucket == 'year'){
              stepSize = 0;
          } else{
          stepSize = 1;
          }
          //目盛りの最大値・最小値を設定
          yAxesScale[i].min = 0;
          yAxesScale[i].max = Enumerable.from(grafData[i]).where(x => x != null).max() + 1;
          
          var grafType = "line";
          var d = {
            type: grafType,
            label: names_ja[i],
            boxWidth: 0,
            backgroundColor: grafColors[i]["bgColor"],
            borderColor: grafColors[i]["borderColor"],
            data: grafData[i],
            fill: false,
            unit: unit,
            lineTension: 0,
            yAxisID: "y-axis-" + i,
            borderWidth: borderWidth,
            radius: radius
          };
          datasets.push(d);
        }
      }

      //月・年によってX軸に表示するtickの表示上限数を決める
      var bucket = $scope.active_content;
      switch (bucket) {
        case 'month':
          $scope.scaleUnit = 'day';
          $scope.scaleStepSize = 5;
          $scope.scaleDisplayFormats = 'M/D';
          $scope.maxTicksLimit = 4;
          $scope.xAxesLabelFormat = 'M月D日';
          var axesX = grafDate_week;
          var autoskip = true;
          var dispAxesX = true;
          break;

        case 'year':
          $scope.scaleUnit = 'month';
          $scope.scaleStepSize = 2;
          $scope.scaleDisplayFormats = 'M月';
          $scope.maxTicksLimit = 12;
          var axesX = grafDate_year;
          var autoskip = false;
          if (names_ja == "歩数") {
            $scope.tooltipFormatFlg = 'hosu';
            $scope.xAxesLabelFormat = 'M月';
            var dispAxesX = true;
          } else {
            $scope.tooltipFormatFlg = 'body';
            $scope.xAxesLabelFormat = 'M月D日';
            var dispAxesX = false;
          }

          break;
      }

      //グラフを作成する
      $scope.myChart = new Chart(ctx, {
        type: "line",
        data: {
          //X軸のラベル
          labels: axesX,
          //グラフデータ
          datasets: datasets,
        },
        options: {
          scales: {
            xAxes: [{
              gridLines: {
                display: false
              },
              ticks: {
                maxTicksLimit: $scope.maxTicksLimit,
                maxRotation: 0,
                autoSkip: autoskip
              }
            }],

            yAxes: [
              {
                id: "y-axis-0",
                type: "linear",
                position: "left",
                display: true,
                ticks: {
                  min: yAxesScale[0].min,          //最小値
                  max: yAxesScale[1].max,          //最大値 
                  stepSize: stepSize   //目盛間隔
                }
              },

              {
                id: "y-axis-1",
                type: "linear",
                position: "right",
                display: yAxis1DispFlg,
                ticks: {
                  min: yAxesScale[1].min,          //最小値
                  max: yAxesScale[1].max,          //最大値 
                  stepSize: stepSize   //目盛間隔
                },
                gridLines: {
                  display: false
                }
              }
            ]
          },
          tooltips: {
            callbacks: {
              title: function (tooltipItem, data) {//日にちの表示
                switch (bucket) {
                  case 'month':
                    return tooltipItem[0].xLabel;
                    break;
                  case 'year':
                    if ($scope.tooltipFormatFlg == 'hosu') {
                      return tooltipItem[0].xLabel;
                    } else {
                      //return moment(tooltipItem[0].xLabel).format($scope.xAxesLabelFormat);
                      return null;
                    }

                    break;
                }
              },
              label: function (tooltipItem, data) {//測定値の表示
                return tooltipItem.yLabel.toLocaleString() + unit[tooltipItem.datasetIndex];
              },
            }
          }
        }
      });


    }

  })