angular.module('starter.BrainTrainingControllers', [])
  //グラフ画面処理
  .controller('BTrainingCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {    
        //初期処理
        $scope.$on('$ionicView.enter', function () {
        
            //難易度設定
            var difficulty = localStorage.getItem('notoreDifficulty');
            $scope.active_content = difficulty;

            //脳トレ取得
            var url = SERVICE_COMMON.getParameter('api_get_notore_mst');
            SERVICE_COMMON.loading();
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    // console.log(JSON.stringify(data));
                    SERVICE_COMMON.loading_comp();
                    if (data['result'] == '0') {
                        $scope.notoreMst = data['data'];
                        $scope.notores = Enumerable.from(data['data']).where(x => x.kubun == 0).toArray();
                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                    SERVICE_COMMON.loading_comp();
                    //ローディング完了＆$scopeの更新
                    $timeout(function () { $scope.$apply(); });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });

            //脳トレクリア登録処理を共有スコープ化
            SHARE_SCOPE.setScope('regNotore', $scope.regNotore);

        })

        //脳トレクリア登録処理
        $scope.regNotore = function (notoreCd) {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (SERVICE_COMMON.isset(personal) || localStorage.getItem('Tutorial') == 0) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                return false;
            }
            var param = { "user_id": user_id, "notore_code": notoreCd };
            var url = SERVICE_COMMON.getParameter('api_reg_notore');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, param))
                .done(function (data, textStatus, jqXHR) {
                    SERVICE_COMMON.toast(data['msg']);
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                });
        }


        //ポップアップを表示
        $scope.popDescription = function (code) {
            $('#pop-frame').fadeToggle(250);
            $scope.popDescriptionItem = Enumerable.from($scope.notoreMst).where(x => x.code == code).toArray()[0];
        }       

        //ポップアップを非表示
        $scope.popDescriptionClose = function () {
            $('#pop-frame').fadeToggle(250);
        }

        //脳トレ遷移
        $scope.notoreMove = function (code) {
            //共有コントローラへ渡す
            var pageName = Enumerable.from($scope.notoreMst).where(x => x.code == code).first().page;
            var questionCount = Enumerable.from($scope.notoreMst).where(x => x.code == code).first().question_count;
            var notoreData = Enumerable.from($scope.notoreMst).where(x => x.kubun == code).toArray();
            var difficulty = $scope.active_content;
            SHARE_DATA.setData('NotoreCode', code);
            console.log('NotoreCode');
            SHARE_DATA.setData('NotoreData', notoreData);
            SHARE_DATA.setData('QuestionCount', questionCount);
            SHARE_DATA.setData('NotoreDifficulty', difficulty);

            //詳細画面へ遷移
            SERVICE_COMMON.MovePage(`#/tab/btraining/${pageName}/`);

        }            

        //難易度切り替え
        $scope.setActiveContent = function (difficulty) {
            //難易度設定
            console.log(difficulty);
            localStorage.setItem('notoreDifficulty', difficulty);
            $scope.active_content = difficulty;
        }

    })
    .controller('PuzzleCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {
        //初期表示処理
        $scope.$on('$ionicView.enter', function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                //return false;
            }
            var pos = [];
            var change = false;
            var select;
            var timerId = localStorage.getItem('PuzzleTimerId');
            clearInterval(timerId);
            //画像サイズ
            var imageSize = 300;
            //１マスあたりのサイズ（ここのサイズを小さくすればマスが増える）
            var liSize = 100;

            //難易度がハードならマスを増やす
            var difficulty = SHARE_DATA.getData('NotoreDifficulty');
            if (difficulty == 'hard') {
                liSize = 60;
            }
            //1行あたりのマス数
            var gridRow = (imageSize / liSize);
            //トータルのマス数
            var gridCount = gridRow * gridRow;

            //配列posの番号からX座標を返す関数
            function posX(n) {
                return n % gridRow * -liSize;
            }
            //配列posの番号からY座標を返す関数
            function posY(n) {
                return Math.floor(n / gridRow) * -liSize;
            }
            //配列posの位置に移動させる関数
            function sortArr() {
                for (i = 0; i < gridCount; i++) {
                    $("#puzzle li#" + i).css({
                        "width": liSize + "px ",
                        "height": liSize + "px ",
                        "left": -posX(pos[i]) + "px ",
                        "top": -posY(pos[i]) + "px"
                    });
                }
            }
            //liタグの生成
            for (i = 0; i < gridCount; i++) {
                pos[i] = i;
                $("<li id='" + i + "'></li>").css("background-position", posX(i) + "px " + posY(i) + "px").appendTo($("#puzzle"));
            }
            //前画面から送られてきたコード
            var puzzle_imgs = SHARE_DATA.getData('NotoreData');
            console.log(JSON.stringify(puzzle_imgs));

            //ランダムなパズルIDを取得し、画面に表示
            var random = Math.floor(Math.random() * puzzle_imgs.length);
            $scope.puzzle = puzzle_imgs[random];
            $('#puzzle li').css('background-image', `url(${$scope.puzzle.kanren1})`);
            $scope.$apply();
            sortArr();

            //配列のシャッフル
            function shuffle(array) {
                var random = array.map(Math.random);
                array.sort(function (a, b) {
                    return random[a] - random[b];
                });
            }
            //タイマー処理
            function setTimer() {
                var start = new Date();
                var now;
                var min;
                var sec;
                $scope.timer = setInterval(function () {
                    now = new Date();
                    datet = parseInt((now.getTime() - start.getTime()) / 1000);
                    min = parseInt((datet / 60) % 60);
                    sec = datet % 60;

                    // 数値が1桁の場合、頭に0を付けて2桁で表示する指定
                    if (min < 10) { min = "0" + min; }
                    if (sec < 10) { sec = "0" + sec; }

                    // フォーマットを指定（不要な行を削除する）
                    var timer1 = min + ':' + sec; // パターン1

                    // テキストフィールドにデータを渡す処理（不要な行を削除する）
                    $("#time").text(timer1);

                }, 1000);
                localStorage.setItem('PuzzleTimerId', $scope.timer);
            }

            //クリアー判定
            function goal() {
                var goal = true;
                for (i = 0; i < 9; i++) {
                    if (pos[i] != i) {
                        goal = false;
                    }
                }
                console.log(goal);
                if (goal) {
                    clearInterval($scope.timer);
                    //クリアしたらクリアデータを登録
                    $("#pop-frame_puzzle").show();
                    $scope.clearTime = $("#time").text();
                    //脳トレ登録
                    var regNotore = SHARE_SCOPE.getScope('regNotore');
                    var notoreCode = SHARE_DATA.getData('NotoreCode');
                    regNotore(notoreCode);
                }
            }
            //スタートボタンクリック
            $scope.puzzleStart = function () {
                $("#btn-start").hide();	//スタートボタンを削除
                shuffle(pos);	//配列posの中身をシャッフル
                sortArr();	//配列posの中身に沿ってピースを並び替え
                $("#time-frame").show();	//タイマーの表示
                setTimer();	//タイマーのスタート

                //ピース選択時の処理を定義
                $("#puzzle li").click(function () {
                    if (!change) {	//1枚目のピース選択時の処理
                        $(this).fadeTo(0, 0.5).css("border", "2px solid #ff0");
                        select = $(this).attr("id");
                        change = true;
                    } else {	//2枚目のピース選択時の処理
                        $("#puzzle li#" + select).fadeTo(0, 1).css("border", "none");
                        var id = $(this).attr("id");
                        var replace = pos[select];
                        pos[select] = pos[id];
                        pos[id] = replace;
                        sortArr();
                        change = false;
                        $timeout(function () { goal(); }, 1000);//1秒後にクリア表示（画像をよく見せるため）
                    }
                });
            }
        });

        //もう一度ボタン
        $scope.playAgain = function () {
            history.back();
        }
    })

    //計算
    .controller('CalcCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {
        //初期表示処理
        $scope.$on('$ionicView.enter', function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                //return false;
            }
            //出題数を設定
            $scope.question_no_all = SHARE_DATA.getData('QuestionCount');
            $scope.trueCount = 0;
            //問題出題
            PutQuestion(1);
        });

        //ランダムに四則演算の問題を出題
        function PutQuestion(count) {
            //現在の出題数
            $scope.question_no = count;
            $scope.hdnAnswer = '';
            $scope.hdnSelAnswer = '';

            //演算子の配列
            var EnzanArray = ['+', '-'];
            //難易度がハードなら演算子を増やす
            var difficulty = SHARE_DATA.getData('NotoreDifficulty');
            if (difficulty == 'hard') {
                EnzanArray = ['+', '-', '×', '÷'];
            }
            var enzan = EnzanArray[Math.floor(Math.random() * EnzanArray.length)];
            var left, right;
            var answer = 0;
            var selectA, selectB, selectC, selectD;
            var selectArray = [];
            var selectChoice = [];
            //出題数を表示
            $scope.question_no = count;
            switch (enzan) {
                case '+':
                    left = GetNum20();
                    right = GetNum20();
                    answer = left + right;
                    selectChoice = GetChoice(1, 40, answer);
                    selectArray = [answer, selectChoice[0], selectChoice[1], selectChoice[2]];
                    break;

                case '-'://右辺は左辺より小さい数値
                    left = GetNum20();
                    right = GetNum20(left);
                    answer = left - right;
                    selectChoice = GetChoice(1, 40, answer);
                    selectArray = [answer, selectChoice[0], selectChoice[1], selectChoice[2]];
                    break;

                case '×'://右辺は1桁
                    left = GetNum20();
                    right = GetNum20(9);
                    answer = left * right;
                    selectChoice = GetChoice(1, 220, answer);
                    selectArray = [answer, selectChoice[0], selectChoice[1], selectChoice[2]];
                    break;

                case '÷'://右辺は1桁
                    answer = GetNum20();
                    right = GetNum20(9);
                    left = answer * right;
                    selectChoice = GetChoice(1, 20, answer);
                    selectArray = [answer, selectChoice[0], selectChoice[1], selectChoice[2]];
                    break;
            }

            //回答を隠し項目に保存
            $scope.hdnAnswer = answer;
            $scope.formula = left + enzan + right + ' = ?';
            //選択肢を配列にし、順番をランダムに
            for (var i = selectArray.length - 1; i >= 0; i--) {
                // 0~iのランダムな数値を取得
                var rand = Math.floor(Math.random() * (i + 1));
                // 配列の数値を入れ替える
                [selectArray[i], selectArray[rand]] = [selectArray[rand], selectArray[i]]
            }
            //選択肢に反映
            $scope.selectA = selectArray[0];
            $scope.selectB = selectArray[1];
            $scope.selectC = selectArray[2];
            $scope.selectD = selectArray[3];
        }

        //ランダムな20までの数値を返す(引数に上限値を入れることで変更可能)
        function GetNum20(max = 21) {
            var random = Math.floor(Math.random() * max) + 2;
            return random;
        }

        //ランダムな数値を返す(最大、最小あり)
        function GetNum(min, max) {
            var random = Math.floor(Math.random() * (max - min + 1)) + min;
            return random;
        }

        //乱数作成(重複なし)
        function GetChoice(min, max, answer) {
            var selectChoice = [];
            for (i = 0; i <= 2; i++) {
                while (true) {
                    var tmp = GetNum(min, max);
                    if (!selectChoice.includes(tmp) && tmp != answer) {
                        selectChoice[i] = tmp;
                        break;
                    }
                }
            }
            return selectChoice;
        }

        //選択肢選択
        $scope.SelectAnswer = function (selecter) {
            var selAnswer = $(`#selVal${selecter}`).text();
            //選択された回答を隠し項目へ
            $scope.hdnSelAnswer = selAnswer;
            //スタイルの変更
            $('.selecter').removeClass('selecter-selected');
            $(`#sel${selecter}`).addClass('selecter-selected');
        }

        //答え合わせ＆次の問題へ
        $scope.NextQuestion = function () {
            if ($scope.hdnSelAnswer == '') {
                SERVICE_COMMON.toast('答えを選択してください');
                return false;
            }
            //答え合わせ
            if ($scope.hdnAnswer == $scope.hdnSelAnswer) {
                $('#pop-answer').show();
                $('#pop-answer-true').show();
                $scope.trueCount += 1;
            } else {
                $('#pop-answer').show();
                $('#pop-answer-false').show();
            }
            $timeout(function () {
                $('#pop-answer').hide();
                $('#pop-answer-true').hide();
                $('#pop-answer-false').hide();
                $('.selecter').removeClass('selecter-selected');
                //次の問題へ
                if ($scope.question_no == $scope.question_no_all) {
                    //終了 リザルト表示
                    $('#pop-frame_calc').show();
                    //脳トレ登録
                    var regNotore = SHARE_SCOPE.getScope('regNotore');
                    var notoreCode = SHARE_DATA.getData('NotoreCode');
                    regNotore(notoreCode);
                } else {
                    PutQuestion($scope.question_no + 1);
                }
            }, 2000);
        }

        $scope.playAgain = function () {
            history.back();
        }
    })
    //漢字
    .controller('KanjiCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {
        // //初期表示処理
        $scope.$on('$ionicView.enter', function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                return false;
            }
            //前画面から送られてきたコード
            var questions = SHARE_DATA.getData('NotoreData');
            //難易度がで抽出
            var difficulty = SHARE_DATA.getData('NotoreDifficulty');
            if (difficulty == 'hard') {
                $scope.questions = Enumerable.from(questions).where(x => x.kanren5 == 'hard').toArray();
            } else {
                $scope.questions = Enumerable.from(questions).where(x => x.kanren5 == 'easy').toArray();
            }

            //出題数を設定
            $scope.question_no_all = SHARE_DATA.getData('QuestionCount');
            $scope.trueCount = 0;
            //問題出題
            $scope.PutQuestion(1);

        })
        //出題
        $scope.PutQuestion = function (count) {
            //現在の出題数
            $scope.question_no = count;
            $scope.hdnAnswer = '';
            $scope.hdnSelAnswer = '';

            //ランダムに出題
            var random = Math.floor(Math.random() * $scope.questions.length);
            var question = $scope.questions[random];

            //答えを格納しておく
            $scope.hdnAnswer = question.kanren1;

            //選択肢を配列にし、順番をランダムに
            selectArray = [question.kanren1, question.kanren2, question.kanren3, question.kanren4];
            for (var i = selectArray.length - 1; i >= 0; i--) {
                // 0~iのランダムな数値を取得
                var rand = Math.floor(Math.random() * (i + 1));
                // 配列の数値を入れ替える
                [selectArray[i], selectArray[rand]] = [selectArray[rand], selectArray[i]]
            }

            //漢字を表示
            $scope.formula = question.name;
            //選択肢に反映
            $scope.selectA = selectArray[0];
            $scope.selectB = selectArray[1];
            $scope.selectC = selectArray[2];
            $scope.selectD = selectArray[3];

        }

        //選択肢選択
        $scope.SelectAnswer = function (selecter) {
            var selAnswer = $(`#selVal${selecter}`).text();
            //選択された回答を隠し項目へ
            $scope.hdnSelAnswer = selAnswer;
            //スタイルの変更
            $('.selecter').removeClass('selecter-selected');
            $(`#sel${selecter}`).addClass('selecter-selected');
        }

        $scope.NextQuestion = function () {
            if ($scope.hdnSelAnswer == '') {
                SERVICE_COMMON.toast('答えを選択してください');
                return false;
            }
            //答え合わせ
            if ($scope.hdnAnswer == $scope.hdnSelAnswer) {
                $('#pop-answer').show();
                $('#pop-answer-true').show();
                $scope.trueCount += 1;
            } else {
                $('#pop-answer').show();
                $('#pop-answer-false').show();
            }
            $timeout(function () {
                $('#pop-answer').hide();
                $('#pop-answer-true').hide();
                $('#pop-answer-false').hide();
                $('.selecter').removeClass('selecter-selected');
                //次の問題へ
                if ($scope.question_no == $scope.question_no_all) {
                    //終了 リザルト表示
                    $('#pop-frame_kanji').show();
                    //脳トレ登録
                    var regNotore = SHARE_SCOPE.getScope('regNotore');
                    var notoreCode = SHARE_DATA.getData('NotoreCode');
                    regNotore(notoreCode);
                } else {
                    $scope.PutQuestion($scope.question_no + 1);
                }
            }, 2000);
        }
        $scope.playAgain = function () {
            history.back();
        }

    })
    //間違い探し
    .controller('DiffSearchCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {
        //初期表示処理
        $scope.$on('$ionicView.enter', function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                //return false;
            }
            //前画面から送られてきたコード
            $scope.questions = SHARE_DATA.getData('NotoreData');
            $scope.question_no_all = SHARE_DATA.getData('QuestionCount');

            //難易度がハードなら出題数を増やす
            var difficulty = SHARE_DATA.getData('NotoreDifficulty');
            if (difficulty == 'hard') {
                $scope.question_no_all = $scope.question_no_all * 2;
            }

            //文字たち      
            var questionsMoji = Enumerable.from($scope.questions).select(x => x.name).toArray();
            //色たち
            var pagename = $state.current.name;
            if (pagename == 'tab.btraining-diffsearch') {
                var backColors = Enumerable.from($scope.questions).select(x => x.kanren1).toArray();
                var fontColors = ['white', 'black'];
            }
            if (pagename == 'tab.btraining-diffcolor') {
                var fontColors = Enumerable.from($scope.questions).select(x => x.kanren1).toArray();
                var backColors = ['white'];
            }

            //ランダムに組み合わせを生成する
            var items = [];
            for (var i = 0; i <= $scope.question_no_all; i++) {
                var randomMoji = Math.floor(Math.random() * questionsMoji.length);
                var randBackColor = Math.floor(Math.random() * backColors.length);
                var randFontColor = Math.floor(Math.random() * fontColors.length);
                var temp = { "name": questionsMoji[randomMoji], "back_color": backColors[randBackColor], "font_color": fontColors[randFontColor] };
                items.push(temp);
            }
            $scope.items = items;

            //正解数保持用
            $scope.ansCount = 0;
            $scope.failCount = 0;
            $scope.ansAllCount = 0;
            $scope.remainCount = 0;

            //正しい正解の組み合わせが何個あるか
            $scope.items.forEach(function (item) {
                if (pagename == 'tab.btraining-diffsearch') {
                    isExists = Enumerable.from($scope.questions).where(x => x.name == item.name && x.kanren1 == item.back_color).count();
                }
                if (pagename == 'tab.btraining-diffcolor') {
                    isExists = Enumerable.from($scope.questions).where(x => x.name == item.name && x.kanren1 == item.font_color).count();
                }
                if (isExists == 1) {
                    $scope.ansAllCount += 1;
                }
            });
            $scope.remainCount = $scope.ansAllCount;

            console.log($scope.ansAllCount);

        })

        $scope.choiceAnswer = function (elemIndex, name, color, font_color) {
            var pagename = $state.current.name;
            //選択した組み合わせが正しいか
            var isAnswer = Enumerable.from($scope.questions).where(x => x.name == name && x.kanren1 == color).count();
            if (isAnswer == 1) {
                //正解
                $(`#selMoji${elemIndex}`).text('〇');
                $(`#selMoji${elemIndex}`).css('color', 'red');
                $(`#sel${elemIndex}`).css('font-weight', 'bold');
                $(`#selBack${elemIndex}`).css('background-color', 'white');
                //正解数をカウント
                $scope.ansCount += 1;
                //残りの正解カウントを減らす
                $scope.remainCount -= 1;
                //全て回答したか
                if ($scope.ansAllCount == $scope.ansCount) {
                    $('#pop-frame_diff').show();
                    //脳トレ登録
                    var regNotore = SHARE_SCOPE.getScope('regNotore');
                    var notoreCode = SHARE_DATA.getData('NotoreCode');
                    regNotore(notoreCode);
                }
            } else {
                //不正解
                $(`#selMoji${elemIndex}`).text('×');
                $(`#selMoji${elemIndex}`).css('color', 'blue');
                $(`#selMoji${elemIndex}`).css('font-weight', 'bold');
                $(`#selBack${elemIndex}`).css('background-color', 'white');
                //不正解数をカウント
                $scope.failCount += 1;
            }

        }
        $scope.playAgain = function () {
            history.back();
        }
    }) //2023-08-25 SAKUTA ADD とりあえずとじた
    //暗記
    .controller('AnkiCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {
        /*
            *出題の流れ
            *１問目：数字の配列（４つ）ーランダムに抽出
            *２問目：英語の配列（５つ）ーランダムに抽出
            *３問目：果物の配列（６つ）
            *４問目：動物の配列（６つ）
            *５問目：運動の配列（６つ）
            */
        //初期表示処理
        $scope.$on('$ionicView.enter', function () {
            
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                //return false;
            }
            //前画面から送られてきたコード
            $scope.questions = SHARE_DATA.getData('NotoreData');
            $scope.question_no_all = SHARE_DATA.getData('QuestionCount');

            //難易度がハードなら出題数を増やす
            var difficulty = SHARE_DATA.getData('NotoreDifficulty');
            if(difficulty == 'hard'){
                $scope.hardMode = true;
            }else{
                $scope.hardMode = false;
            }

            //現在の正解数
            $scope.trueCount = 0;

            $scope.numArray = Enumerable.from($scope.questions).where(x => x.kanren2 == 'num').toArray();
            $scope.mojiArray = Enumerable.from($scope.questions).where(x => x.kanren2 == 'moji').toArray();
            $scope.fluitsArray = Enumerable.from($scope.questions).where(x => x.kanren2 == 'fruits').toArray();
            $scope.animalArray = Enumerable.from($scope.questions).where(x => x.kanren2 == 'animal').toArray();
            $scope.sportsArray = Enumerable.from($scope.questions).where(x => x.kanren2 == 'sports').toArray();
            $('#anki-select4').hide();
            $("#btn-go").hide();
        });

        //出題スタート
        $scope.AnkiStart = function () {
            $('#start').hide();
            $('#anki-select4').hide();
            $('#anki-counter').show();
            $('.selecter').removeClass('selecter-selected');
            $('#pop-answer').hide();
            $('#pop-answer-true').hide();
            $('#pop-answer-false').hide();
            $("#btn-go").hide();

            //問題を出題
            $scope.PutAnki(1);
        }

        //暗記問題を出題
        $scope.PutAnki = function (count) {
            $scope.hdnAnswer = '';
            $scope.hdnSelAnswer = '';

            //初期化
            $('#anki-message').text('画像の並びをよく記憶してください');
            
            $('#anki-counter_val').show();
            $('#anki-counter_val').text('5');
            //問題配列
            var ChoiceArray = [];
            //出題配列
            var QuestionArray = [];
            //出題数を表示
            $scope.question_no = count;
            //何問目かによって問題を変える
            switch (count) {
                case 1:
                    var count = 4;
                    if($scope.hardMode){
                        count += 2;
                    }
                    //出題配列を生成（４つ）
                    QuestionArray = $scope.ExtractArray($scope.numArray, count);
                    QuestionArrayAll = $scope.numArray;
                    break;

                case 2:
                    var count = 5;
                    if($scope.hardMode){
                        count += 2;
                    }
                    //出題配列を生成（５つ）
                    QuestionArray = $scope.ExtractArray($scope.mojiArray, count);
                    QuestionArrayAll = $scope.mojiArray;
                    break;

                case 3:
                    var count = 6;
                    if($scope.hardMode){
                        count += 2;
                    }
                    //出題配列を生成（６つ）
                    QuestionArray = $scope.ExtractArray($scope.fluitsArray, count);
                    QuestionArrayAll = $scope.fluitsArray;
                    break;

                case 4:
                    var count = 6;
                    if($scope.hardMode){
                        count += 2;
                    }
                    //出題配列を生成（６つ）
                    QuestionArray = $scope.ExtractArray($scope.animalArray, count);
                    QuestionArrayAll = $scope.animalArray;
                    break;

                case 5:
                    var count = 6;
                    if($scope.hardMode){
                        count += 2;
                    }
                    //出題配列を生成（６つ）
                    QuestionArray = $scope.ExtractArray($scope.sportsArray, count);
                    QuestionArrayAll = $scope.sportsArray;
                    break;
            }
            
            //表示
            $scope.imgs = QuestionArray;

            //カウント開始
            counter_count = 5;//制限時間

            //１秒おきにカウンターの文字を切り替え（難易度に応じて）
            var timer = 1000;
            if($scope.hardMode){
                timer = 700;
            }
            //カウント処理
            counter_start = setInterval(function () {
                //カウントの文字を変更
                $('#anki-counter_val').text(counter_count);

                //5秒経過後に画像を変更
                if (counter_count == 0) {
                    var AnsArray = [];

                    //？に変更し、再表示
                    var rand = Math.floor(Math.random() * QuestionArray.length);

                    //答え格納用配列に答えの配列を格納
                    AnsArray[0] = JSON.parse(JSON.stringify(QuestionArray[rand]));
                    $scope.hdnAnswer = AnsArray[0]['name'];

                    $('#hdn-answer').val(QuestionArray[rand]['name']);
                    $('#hdn-answer_id').val(QuestionArray[rand]['id']);
                    
                    QuestionArray[rand]['kanren1'] = './img/notore/question.png';

                    $scope.imgs = QuestionArray;

                    //答え＋出題配列の中から３つをランダムに
                    
                    //ChoiceArrayから答えの要素を削除する（かぶるから）
                    var QuesId = QuestionArray[rand]['name'];
                    ChoiceArray = Enumerable.from(QuestionArrayAll).where(x => x.name != QuesId).toArray();
                    //選択肢を３つランダムに取得
                    ChoiceArray = $scope.ExtractArray(ChoiceArray, 3);
                    //答え格納用配列に残りの3つを格納
                    for (var i = 0; i <= 2; i++) {
                        AnsArray[i + 1] = ChoiceArray[i];
                    }                    
                    //シャッフル
                    for (var i = AnsArray.length - 1; i >= 0; i--) {
                        // 0~iのランダムな数値を取得
                        var randA = Math.floor(Math.random() * (i + 1));
                        // 配列の数値を入れ替える
                        [AnsArray[i], AnsArray[randA]] = [AnsArray[randA], AnsArray[i]]
                    }

                    //選択肢に反映
                    $scope.selectA = AnsArray[0]['kanren1'];
                    $scope.selectB = AnsArray[1]['kanren1'];
                    $scope.selectC = AnsArray[2]['kanren1'];
                    $scope.selectD = AnsArray[3]['kanren1'];

                    //選択を表示
                    $scope.ans = AnsArray;
                    $scope.$apply();

                    $('#anki-message').text('ハテナにはいるものは何だった？？');
                    $('#anki-select4').show();
                    $("#btn-go").show();
                    $('#anki-counter_val').hide();
                    //setIntervalの停止
                    clearInterval(counter_start);
                }
                counter_count--;
            }, timer);

        }
        


        //選択肢選択
        $scope.SelectAnswer = function (elm) {
            switch(elm){
                case 'A':
                    $scope.hdnSelAnswer = $scope.ans[0]['name'];
                    break;
                case 'B':
                    $scope.hdnSelAnswer = $scope.ans[1]['name'];
                    break;
                case 'C':
                    $scope.hdnSelAnswer = $scope.ans[2]['name'];
                    break;
                case 'D':
                    $scope.hdnSelAnswer = $scope.ans[3]['name'];
                    break;
            }
            $('.selecter').removeClass('selecter-selected');
            $(`#sel${elm}`).addClass('selecter-selected');
            $('#btn-go').addClass('cal-go-active');
        }

        //答え合わせ＆次の問題へ
        $scope.NextQuestion = function () {
            isSelected = $('#btn-go').hasClass('cal-go-active');
            if (!isSelected) {
                return false;
            }
            //答え合わせ
            var ans = $('#hdn-answer').val();
            var sel_ans = $('#hdn-sel-answer').val();
            console.log(ans + '????' + sel_ans);
            $scope.AnsImg = $('#hdn-answer_id').val();
            if (ans == sel_ans) {
                //正解時
                $('#pop-answer').show();
                $('#pop-answer-true').show();
                //正解数をカウント
                // $('#true-count').text($('#true-count').text() * 1 + 1);
                $scope.trueCount += 1;
            } else {
                //不正解時
                $('#pop-answer').show();
                $('#pop-answer-false').show();
            }
            $timeout(function () {
                //隠し項目の初期化
                $('#hdn-answer').val('');
                $('#hdn-sel-answer').val('');
                //ポップアップ非表示
                $('#pop-answer').hide();
                $('#pop-answer-true').hide();
                $('#pop-answer-false').hide();
                //次の問題へ
                var count = $scope.question_no;

                if (count == 5) {
                    //終了 リザルト表示
                    // $('#pop-result').show();
                     $('#pop-frame_calc').show();
                    //クリア回数を登録
                    var personal = JSON.parse(localStorage.getItem('Personal'));
                    if (SERVICE_COMMON.isset(personal)) {
                        var user_id = personal['user_id'];
                        $scope.user_id = user_id;
                    } else {
                        SERVICE_COMMON.popup('個人設定が未登録です');
                        return false;
                    }
                    // var obj = {};
                    // obj['user_id'] = user_id;
                    // obj['type'] = 'anki';
                    // var url = SERVICE_GET_SETTINGDATA.API_REG_NOTORE();
                    // $.ajax(SERVICE_COMMON.getAjaxOption(url, obj))
                    //     .done(function (data, textStatus, jqXHR) {
                    //         if (data['result'] != '0') {
                    //             SERVICE_COMMON.toast('データの登録に失敗しました');
                    //         }
                    //     })
                    //     .fail(function (jqXHR, textStatus, errorThrown) {
                    //         console.log(JSON.stringify(jqXHR));
                    //     });

                    //脳トレ登録
                    var regNotore = SHARE_SCOPE.getScope('regNotore');
                    var notoreCode = SHARE_DATA.getData('NotoreCode');
                    regNotore(notoreCode);

                } else {
                    //スタイルの変更
                    $('.selecter').removeClass('selecter-selected');
                    $('#anki-select4').hide();
                    $("#btn-go").hide();
                    $('#btn-go').removeClass('cal-go-active');
                    $scope.PutAnki(count + 1);
                }
            }, 2000);
        }

        
        //配列を指定した要素数にシャッフルし抽出
        $scope.ExtractArray = function (array, count) {
            array = JSON.parse(JSON.stringify(array));
            // 抽出する要素を格納する配列
            var extractedArray = [];

            // 引数countが配列の長さより大きい場合、全ての要素を抽出して返す
            if (count >= array.length) {
                return array;
            }
            // 引数countが0以下の場合、空の配列を返す
            if (count <= 0) {
                return extractedArray;
            }
            // ランダムに要素を抽出する
            for (var i = 0; i < count; i++) {
                var randomIndex = Math.floor(Math.random() * array.length);
                extractedArray.push(array[randomIndex]);

                // 重複のない抽出を行うために、抽出した要素を元の配列から削除する
                array.splice(randomIndex, 1);
            }
            return extractedArray;
        }

        //もう一度ボタン
        $scope.playAgain = function () {
            history.back();
        }
    })
    //じゃんけん
    .controller('JankenCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, $state, SERVICE_COMMON, SHARE_DATA, SHARE_SCOPE) {
        //初期表示処理
        $scope.$on('$ionicView.enter', function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var user_id;
            if (SERVICE_COMMON.isset(personal)) {
                user_id = personal['user_id'];
            } else {
                SERVICE_COMMON.toast('個人設定が登録されていません');
                //return false;
            }

            //出題数を設定
            $scope.question_no = 0;
            $scope.question_no_all = SHARE_DATA.getData('QuestionCount');
            $scope.question_no_all = 10;
            //現在の正解数
            $scope.trueCount = 0;

        })

        //スタートボタンタップ時
        $scope.startQuestion = function () {
            $scope.questionStart = true;
            $scope.putQuestion(1);
        }
        //出題する
        $scope.putQuestion = function (count) {
            //制限時間（ms）
            var timer = 3000;
            //難易度がハードならマスを増やす
            var difficulty = SHARE_DATA.getData('NotoreDifficulty');
            if (difficulty == 'hard') {
                timer = 1500;
            }

            $('.selecter').removeClass('selecter-selected');
            $('#pop-answer').hide();
            $('#pop-answer-true').hide();
            $('#pop-answer-false').hide();

            //現在の出題数
            $scope.question_no = count;

            //選択状態のリセット
            $scope.selAnswer = -1;

            /*じゃんけんアルゴリズム
              グー = 0            チョキ = 1      パー = 2
              として、(自分の手 - 相手の手 + 3) % 3 の値を見て
              0 = 引き分け        1 = 負け        2 = 勝ち
            */

            //出題に必要な配列達
            var selecters = ['./img/notore/janken/gu.png', './img/notore/janken/choki.png', './img/notore/janken/pa.png'];
            var selecterids = ['gu', 'choki', 'pa'];
            var question_texts = ['あいこ！', '負けろ！', '勝て！'];
            var question_classes = ['color-grn', 'color-ble', 'color-red'];

            var selRandom = Math.floor(Math.random() * selecters.length);
            var questionRandom = Math.floor(Math.random() * question_texts.length);
            var classRandom = Math.floor(Math.random() * question_classes.length);

            //相手の手
            $scope.enemyAnsewr = selRandom;
            $scope.question = selecters[selRandom];
            $scope.answer = questionRandom;

            //問題
            $scope.question_text = question_texts[questionRandom];
            $scope.question_class = question_classes[classRandom];

            //3秒後に正解発表
            $timeout(function () {
                //じゃんけんアルゴリズムに基づき計算
                console.log($scope.selAnswer);
                if ($scope.selAnswer < 0) {
                    $('#pop-answer').show();
                    $('#pop-answer-false').show();
                } else {
                    var result = ($scope.selAnswer - $scope.enemyAnsewr + 3) % 3;
                    console.log(`(${$scope.selAnswer} - ${$scope.enemyAnsewr} + 3) % 3 = ${result} === ${$scope.answer}`);
                    if (result == $scope.answer) {
                        $('#pop-answer').show();
                        $('#pop-answer-true').show();
                        $scope.trueCount += 1;
                    } else {
                        $('#pop-answer').show();
                        $('#pop-answer-false').show();
                    }
                }

                //全問回答したか
                if ($scope.question_no == $scope.question_no_all) {
                    //リザルト表示
                    $timeout(function () {
                        $('#pop-answer').hide();
                        $('#pop-answer-true').hide();
                        $('#pop-answer-false').hide();
                        $('#pop-frame_janken').show();
                        //脳トレ登録
                        var regNotore = SHARE_SCOPE.getScope('regNotore');
                        var notoreCode = SHARE_DATA.getData('NotoreCode');
                        regNotore(notoreCode);
                    }, 2000);
                } else {
                    //2秒後に次の問題へ
                    $timeout(function () {
                        var pagename = $state.current.name;
                        console.log(pagename);
                        //途中でページ外へ抜けた場合、全問終わるまで終わらないので強制的に終わらせる
                        if (pagename == 'tab.btraining-janken') {
                            //次の問題
                            $scope.putQuestion($scope.question_no + 1);
                        }
                    }, 1500);
                }
            }, timer);
        }

        //選択肢選択
        $scope.SelectAnswer = function (selecter, index) {

            $scope.selAnswer = index;
            $('.selecter').removeClass('selecter-selected');
            $(`#sel_${selecter}`).addClass('selecter-selected');
        }
        $scope.playAgain = function () {
            history.back();
        }
    })