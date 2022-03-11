<template>
    <div>
        <canvas ref="myCanvas" width="512" height="480"></canvas>
        <div class="speed-container">
            <button class="hero-speed" @click="slowDown">-</button>
            <div>英雄移动速度{{hero.speed}}px</div>
            <button class="hero-speed" @click="accelerate">+</button>
        </div>
    </div>
</template>

<script>
import bgImg from "../assets/images/background.png";
import heroImg from "../assets/images/hero.png";
import monsterImg from "../assets/images/monster.png";

export default {
    name: "Game",
    data() {
        return {
            ctx: null,
            //图片
            bgReady: null,
            bgImage: null,
            heroReady: null,
            heroImage: null,
            monsterReady: null,
            monsterImage: null,
            //骑士
            hero: {
                speed: 128,
            },
            //怪物
            monster: {},
            //抓到的怪物数量
            monstersCaught: 0,
            //预测的方向
            prediction: null,
            //时间
            now: null,
            then: null,
        };
    },
    mounted() {
        // 往全局事件总线身上绑定一个自定义事件: 获取预测的结果
        this.$bus.$on("getPrediction", (prediction) => {
            this.prediction = prediction;
        });

        //创建画布
        var canvas = this.$refs.myCanvas;
        this.ctx = canvas.getContext("2d");
        canvas.width = 512;
        canvas.height = 480;

        this.reset();

        var w = window;
        requestAnimationFrame =
            w.requestAnimationFrame ||
            w.webkitRequestAnimationFrame ||
            w.msRequestAnimationFrame ||
            w.mozRequestAnimationFrame;
        this.then = Date.now();

        this.reset();

        this.main();
    },
    beforeDestroy() {
        //解绑自定义事件
        this.$bus.$off("getPrediction");
    },
    methods: {
        accelerate(){
            if(this.hero.speed < 388){
                this.hero.speed += 4
            }
            else{
                alert('已到达最大速度')
            }            
        },
        slowDown(){
            if(this.hero.speed >= 32){
                this.hero.speed -= 4
            }
            else{
                alert('已到达最小速度')
            }     
        },

        //开启新一轮游戏
        reset() {
            var canvas = this.$refs.myCanvas;

            this.hero.x = canvas.width / 2;
            this.hero.y = canvas.height / 2;

            // Throw the monster somewhere on the screen randomly
            this.monster.x = 32 + Math.random() * (canvas.width - 95);
            this.monster.y = 32 + Math.random() * (canvas.height - 95);
        },

        //处理键盘事件，操作游戏对象
        update(modifier, prediction) {
            switch (prediction) {
                case 0:
                    if (this.hero.y >= 32) {
                        // Player holding up
                        this.hero.y -= this.hero.speed * modifier;
                    }
                    break;
                case 1:
                    if (this.hero.y <= 412) {
                        // Player holding down
                        this.hero.y += this.hero.speed * modifier;
                    }
                    break;
                case 2:
                    if (this.hero.x >= 32) {
                        // Player holding left
                        this.hero.x -= this.hero.speed * modifier;
                    }
                    break;
                case 3:
                    if (this.hero.x <= 448) {
                        // Player holding right
                        this.hero.x += this.hero.speed * modifier;
                    }
                    break;
            }

            // Are they touching?
            if (
                this.hero.x <= this.monster.x + 32 &&
                this.monster.x <= this.hero.x + 32 &&
                this.hero.y <= this.monster.y + 32 &&
                this.monster.y <= this.hero.y + 32
            ) {
                ++this.monstersCaught;
                this.reset();
            }
        },

        //渲染到画布上
        renderEverything() {
            // Background image
            this.bgImage = new Image();
            this.bgImage.src = bgImg;
            this.ctx.drawImage(this.bgImage, 0, 0);

            // Hero image
            this.heroImage = new Image();
            this.heroImage.src = heroImg;
            this.ctx.drawImage(this.heroImage, this.hero.x, this.hero.y);

            // Monster image
            this.monsterImage = new Image();
            this.monsterImage.src = monsterImg;
            this.ctx.drawImage(
                this.monsterImage,
                this.monster.x,
                this.monster.y
            );

            // Score
            this.ctx.fillStyle = "rgb(250, 250, 250)";
            this.ctx.font = "24px Helvetica";
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "top";
            this.ctx.fillText("Monster caught: " + this.monstersCaught, 32, 32);
        },

        //主函数
        main() {
            this.now = Date.now();

            var delta = this.now - this.then;
            //console.log(delta);
            this.update(delta / 1000, this.prediction);
            this.renderEverything();

            this.then = this.now;

            // Request to do this again ASAP
            requestAnimationFrame(this.main);
        },
    },
};
</script>

<style>
.speed-container {
    display: flex;
    width: 265px;
    margin: 10px auto;
    font-size: 1.2rem;
}
.hero-speed {
    margin-left: 10px;
    margin-right: 10px;
    border : 2px solid gray;
    border-radius: 2px;
    width: 20px;
}
</style>