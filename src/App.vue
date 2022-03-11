<template>
    <div id="app">
        <div class="game"><Game></Game></div>
        <div class="tensorflow"><Tensorflow>></Tensorflow></div>
    </div>
</template>

<script>
import Game from "./components/Game.vue";
import Tensorflow from "./components/Tensorflow.vue";

export default {
    name: "App",
    components: {
        Game,
        Tensorflow,
    },
};
</script>

<style>
#app {
    display: flex;
}
.tensorflow {
    margin: 50px 80px;
}
</style>
