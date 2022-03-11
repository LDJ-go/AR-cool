<template>
	<div>
		<div class="tensorflow_container">
			<!-- 摄像头 -->
			<div class="camera_box">
				<div class="camera_container">
					<video
						id="webcam"
						autoplay
						playsinline
						muted
						width="224"
						height="224"
					></video>
				</div>
			</div>
			<!-- 样本 -->
			<div class="panel">
				<div class="panel-row panel-row-top">
					<div class="panel-cell panel-cell-left panel-cell-fill">
						<p class="help-text">
							点击方框分别拍照<br />
							用于控制英雄行进的<br />
							四个方向的不同姿势<br />
							进行模型训练
						</p>
					</div>
					<div class="panel-cell panel-cell-center">
						<div class="thumb-box">
							<div class="thumb-box-outer" id="up-thumb-box-outer">
								<div class="thumb-box-inner">
									<canvas
										class="thumb"
										width="224"
										height="224"
										id="up-thumb"
									></canvas>
								</div>
								<!-- 上下左右：0123 -->
								<button class="record-button" id="up" @click="captureSample(0)">
									<span>添加样本</span>
								</button>
							</div>
							<!-- 这里需要做成vue的响应式 -->
							<p>
								<span id="up-total">{{ upTotal }}</span>
								examples
							</p>
						</div>
					</div>
					<div class="panel-cell panel-cell-right panel-cell-fill"></div>
				</div>
				<div class="panel-row panel-row-middle">
					<div class="panel-cell panel-cell-left">
						<div class="thumb-box">
							<div class="thumb-box-outer" id="left-thumb-box-outer">
								<div class="thumb-box-inner">
									<canvas
										class="thumb"
										width="224"
										height="224"
										id="left-thumb"
									></canvas>
								</div>
								<button
									class="record-button"
									id="left"
									@click="captureSample(2)"
								>
									<span>添加样本</span>
								</button>
							</div>
							<p>
								<span id="left-total">{{ leftTotal }}</span>
								examples
							</p>
						</div>
					</div>
					<div class="panel-cell panel-cell-center panel-cell-fill">
						<img height="120" width="120" src="../assets/sxzy.png" />
					</div>
					<div class="panel-cell panel-cell-right">
						<div class="thumb-box">
							<div class="thumb-box-outer" id="right-thumb-box-outer">
								<div class="thumb-box-inner">
									<canvas
										class="thumb"
										width="224"
										height="224"
										id="right-thumb"
									></canvas>
								</div>
								<button
									class="record-button"
									id="right"
									@click="captureSample(3)"
								>
									<span>添加样本</span>
								</button>
							</div>
							<p>
								<span id="right-total">{{ rightTotal }}</span>
								examples
							</p>
						</div>
					</div>
				</div>
				<div class="panel-row panel-row-bottom">
					<div class="panel-cell panel-cell-left panel-cell-fill"></div>
					<div class="panel-cell panel-cell-center">
						<div class="thumb-box">
							<div class="thumb-box-outer" id="down-thumb-box-outer">
								<div class="thumb-box-inner">
									<canvas
										class="thumb"
										width="224"
										height="224"
										id="down-thumb"
									></canvas>
								</div>
								<button
									class="record-button"
									id="down"
									@click="captureSample(1)"
								>
									<span>添加样本</span>
								</button>
							</div>
							<p>
								<span id="down-total">{{ downTotal }}</span>
								examples
							</p>
						</div>
					</div>
					<div class="panel-cell panel-cell-right panel-cell-fill"></div>
				</div>
			</div>
		</div>

		<div class="button_container">
			<button class="train" @click="doTraining">开始训练</button>
			<button
				class="start"
				@click="startPredicting"
				:style="{ display: isTranning ? 'none' : '' }"
			>
				开始游戏
			</button>
			<button
				class="stop"
				@click="stopPredicting"
				:style="{ display: isTranning ? 'none' : '' }"
			>
				停止游戏
			</button>
		</div>

		<div class="prediction-text" :style="{ display: isTranning ? 'none' : '' }">
			<div>预测行进方向: {{ predictionText }}</div>
		</div>
	</div>
</template>

<script>
	import * as tf from "@tensorflow/tfjs";

	import { Dataset } from "../utils/dataset";
	import { Webcam } from "../utils/webcam";

	export default {
		name: "Tensorflow",
		data() {
			return {
				webcam: null, //摄像头
				//四个方向的样本数量
				upTotal: 0,
				leftTotal: 0,
				rightTotal: 0,
				downTotal: 0,
				mobilenet: null,
				model: null,
				dataset: null,
				isPredicting: false,
				isTranning: true, // 是否正在训练
				isPlaying: false, // 是否正在游戏中
				THUMB: ["up", "down", "left", "right"],
				thumbDisplayed: {},
				predictionText: "",
			};
		},
		mounted() {
			this.webcam = new Webcam(document.getElementById("webcam"));
			this.dataset = new Dataset();

			this.init();
		},
		methods: {
			// 加载mobilenet
			async loadMobilenet() {
				this.mobilenet = await tf.loadLayersModel(
					"https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
				);
				// 返回输出内部激活的模型.
				const layer = this.mobilenet.getLayer("conv_pw_13_relu");
				return tf.model({
					inputs: this.mobilenet.inputs,
					outputs: layer.output,
				});
			},

			// 添加样本
			captureSample(id) {
				// 上下左右：0123
				switch (parseInt(id)) {
					case 0:
						this.upTotal++;
						// console.log('上');
						break;
					case 1:
						this.downTotal++;
						// console.log('下');
						break;
					case 2:
						this.leftTotal++;
						// console.log('左');
						break;
					case 3:
						this.rightTotal++;
						// console.log('右');
						break;
				}
				const label = parseInt(id);
				const img = this.webcam.capture();
				this.dataset.addExample(this.mobilenet.predict(img), label);
				//绘制预览图
				this.drawThumb(img, label);
				img.dispose();
			},

			// 样本训练
			async train() {
				this.dataset.ys = null;
				this.dataset.encodeLabels(4);
				this.model = tf.sequential({
					layers: [
						tf.layers.flatten({
							inputShape: this.mobilenet.outputs[0].shape.slice(1),
						}),
						tf.layers.dense({ units: 100, activation: "relu" }),
						tf.layers.dense({ units: 4, activation: "softmax" }),
						// 最后一层的单元数应该与我们想要预测的类数相对应。
					],
				});
				// 构建优化器
				const optimizer = tf.train.adam(0.0001);
				// 定义损失函数
				this.model.compile({
					optimizer: optimizer,
					loss: "categoricalCrossentropy",
				});
				let loss = 0;

				this.model.fit(this.dataset.xs, this.dataset.ys, {
					epochs: 10,
					callbacks: {
						onBatchEnd: async (batch, logs) => {
							loss = logs.loss.toFixed(5);
						},
					},
				});
			},

			// 预测
			async predict() {
				while (this.isPredicting) {
					const predictedClass = tf.tidy(() => {
						// 从网络摄像头捕获帧。
						const img = this.webcam.capture();
						// 通过mobilenet进行预测
						const activation = this.mobilenet.predict(img);
						// 使用来自mobilenet的结果作为输入，通过我们新训练的模型进行预测。
						const predictions = this.model.predict(activation);
						// 返回最大概率的情况
						return predictions.as1D().argMax();
					});

					// 该数字对应于模型认为在给定输入的情况下最可能出现的类别。
					const classId = (await predictedClass.data())[0];

					switch (classId) {
						case 0:
							this.predictionText = "上";
							break;
						case 1:
							this.predictionText = "下";
							break;
						case 2:
							this.predictionText = "左";
							break;
						case 3:
							this.predictionText = "右";
							break;
					}

					// 触发自定义事件，传递预测的类别用于控制英雄行进方向
					this.$bus.$emit("getPrediction", classId);

					predictedClass.dispose();
					await tf.nextFrame();
				}
			},

			// 绘制样本预览图
			drawThumb(img, label) {
				if (this.thumbDisplayed[label] == null) {
					const thumbCanvas = document.getElementById(
						this.THUMB[label] + "-thumb"
					);
					this.draw(img, thumbCanvas);
				}
			},
			draw(image, canvas) {
				const [width, height] = [224, 224];
				const ctx = canvas.getContext("2d");
				const imageData = new ImageData(width, height);
				const data = image.dataSync();
				for (let i = 0; i < height * width; ++i) {
					const j = i * 4;
					imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
					imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
					imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
					imageData.data[j + 3] = 255;
				}
				ctx.putImageData(imageData, 0, 0);
			},

			// 调用样本训练函数
			async doTraining() {
				if (
					this.upTotal === 0 &&
					this.downTotal === 0 &&
					this.leftTotal === 0 &&
					this.rightTotal === 0
				) {
					alert("请添加样本 !");
				} else {
					this.isTranning = true;
					await this.train();
					this.isTranning = false;
				}
			},

			// 开始游戏
			startPredicting() {
				this.isPredicting = true;
				this.predict();
			},
			// 结束游戏
			stopPredicting() {
				this.isPredicting = false;
				this.predict();
			},

			async init() {
				await this.webcam.setup();
				this.mobilenet = await this.loadMobilenet();
				tf.tidy(() => this.mobilenet.predict(this.webcam.capture()));
			},
		},
	};
</script>

<style>
	.tensorflow_container {
		display: flex;
	}
	.camera_box {
		background: #228b22;
		border: 1px solid #585858;
		border-radius: 4px;
		box-sizing: border-box;
		display: inline-block;
		padding: 9px;
		height: 184px;
		/* margin-top: 80px; */
		margin-right: 80px;
	}
	.camera_container {
		border: 1px solid #585858;
		border-radius: 4px;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		overflow: hidden;
		width: 160px;
	}
	#webcam {
		height: 160px;
		transform: scaleX(-1);
	}
	.panel {
		padding: 0 9px 0 22px;
		width: 353px;
	}
	.panel-row {
		display: flex;
		flex-direction: row;
	}

	.panel-cell {
		align-items: center;
		display: flex;
		flex-direction: column;
		flex-grow: 0;
		justify-content: center;
		position: relative;
	}
	.panel-cell-fill {
		flex-grow: 1;
	}
	.panel-cell .help-text {
		font-size: 13px;
		color: black;
		/* font-style: italic; */
		left: 0;
		line-height: 1.2;
		margin: 0;
		padding: 0;
		text-align: left;
		top: 0;
		position: absolute;
	}
	.panel-cell p {
		color: #8b8b8b;
		font-size: 10px;
		margin: 0;
		padding: 0;
		text-align: center;
	}

	.panel-row-middle .thumb-box {
		margin-top: 18px;
		margin-bottom: 18px;
	}
	.panel-row-middle .panel-cell {
		height: 132px;
	}

	.thumb-box {
		display: inline-block;
	}
	.thumb-box-outer {
		background: #228b22;
		border: 1px solid #585858;
		border-radius: 4px;
		box-sizing: border-box;
		display: inline-block;
		padding: 9px;
		position: relative;
		transition: box-shadow 0.3s;
	}
	.active {
		box-shadow: 0 0 4px 4px red;
	}
	.thumb-box-inner {
		background-color: #2a9e2a;
		border: 1px solid #8a8888;
		border-radius: 4px;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		overflow: hidden;
		width: 77px;
	}
	.thumb {
		height: 77px;
		/* transform: scaleX(-1); */
	}
	.thumb-box-outer .record-button {
		height: 100%;
		left: 0;
		position: absolute;
		top: 0;
		width: 100%;
	}
	.thumb-box-outer .record-button span {
		background: #111;
		border: 1px solid #585858;
		border-radius: 3px;
		bottom: 9px;
		color: #f8f8f8;
		display: block;
		font-size: 8px;
		left: 9px;
		position: absolute;
		right: 9px;
		opacity: 0.5;
	}

	.button_container {
		margin-top: 20px;
	}
	.train,
	.start,
	.stop {
		/* background-color: red; */
		border: none;
		border-radius: 8px;
		color: white;
		padding: 15px 32px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
	}
	.train:hover,
	.start:hover,
	.stop:hover {
		box-shadow: 0 12px 16px 0 rgba(0, 0, 0, 0.24),
			0 17px 50px 0 rgba(0, 0, 0, 0.19);
	}
	.train {
		background: #4169e1;
	}
	.start {
		background-color: OrangeRed;
		margin-left: 20px;
		margin-right: 20px;
	}
	.stop {
		background-color: gray;
	}

	.prediction-text {
		margin-top: 40px;
		font-size: 1.8rem;
	}

	button {
		background: none;
		border: none;
		box-sizing: border-box;
		cursor: pointer;
		margin: 0;
		padding: 0;
	}
</style>
