/* eslint-disable no-undef */
const path = require("path");
// const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const fs = require('fs')

const isDev = process.env.NODE_ENV === "development";
const isProd = !isDev;


const optimization = () => {
	const config = {
		splitChunks: {
			chunks: "all",
		},
	};

	if (isProd) {
		config.minimizer = [
			new OptimizeCssAssetWebpackPlugin(),
			new TerserWebpackPlugin(),
		];
	}

	return config;
};

const filename = (ext) =>
	isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

// const cssLoaders = (extra) => {
// 	const loaders = [
// 		{
// 			loader: MiniCssExtractPlugin.loader,
// 			options: {
// 				// hmr: isDev,
// 				// reloadAll: true,
//                 publicPath: (resourcePath, context) => {
//                     return path.relative(path.dirname(resourcePath), context) + '/';
//                 }
// 			},
// 		},
// 		"css-loader"
// 	];

// 	if (extra) {
// 		loaders.push(extra);
// 	}

// 	return loaders;
// };
const babelOptions = (preset) => {
	const opts = {
		presets: ["@babel/preset-env"],
		plugins: ["@babel/plugin-proposal-class-properties"],
	};

	if (preset) {
		opts.presets.push(preset);
	}

	return opts;
};

const jsLoaders = () => {
	const loaders = [
		{
			loader: "babel-loader",
			options: babelOptions(),
		},
	];

	if (isDev) {
		loaders.push("eslint-loader");
	}

	return loaders;
};

const plugins = () => {
	const PAGES_DIR = path.resolve(__dirname, "src/pug/pages/");
	console.log("PAGES_DIR", PAGES_DIR)
	const PAGES = fs.readdirSync(PAGES_DIR).filter(fileName => fileName.endsWith('.pug'));
	console.log("PAGES", PAGES)
	const base = [
		// new HTMLWebpackPlugin({
		// 	template: path.resolve(__dirname, "src/index.html"),
		// 	filename: "index.html",
		// 	minify: {
		// 		collapseWhitespace: isProd,
		// 	},
		// }),
		...PAGES.map(page => new HtmlWebpackPlugin ({
			template: `${PAGES_DIR}/${page}`,
			filename: `./${page.replace(/\.pug/,'.html')}`,
			inject: true,
			minify: {
				collapseWhitespace: isProd,
			}
		})),
		// new HtmlWebpackPlugin({
		// 	// template: `${PAGES_DIR}/about/index.pug`,
		// 	template: path.resolve(__dirname, "src/pug/pages/index.pug"),
		// 	filename: 'index.html',
		// 	inject: true,
		// 	minify: {
		// 		collapseWhitespace: isProd,
		// 	}
		// }),
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin({
			patterns: [
				// {
				// 	from: path.resolve(__dirname, "src/favicon.ico"),
				// 	to: path.resolve(__dirname, "dist"),
				// },
				{
					from: path.resolve(__dirname, "src/assets"),
					to: path.resolve(__dirname, "dist"),
				},
			],
		}),
		new MiniCssExtractPlugin({
			filename: `./css/${filename("css")}`,
		}),
	];
	// if (isDev) {
	// 	base.push(new webpack.HotModuleReplacementPlugin());
	// }
	if (isProd) {
		base.push(new BundleAnalyzerPlugin());
		base.push(
			new ImageMinimizerPlugin({
				severityError: 'warning',
				minimizerOptions: {
					// Lossless optimization with custom option
					// Feel free to experiment with options for better result for you
					plugins: [
						["gifsicle", { interlaced: true }],
						["jpegtran", { progressive: true }],
						["optipng", { optimizationLevel: 5 }],
						[
							"svgo",
							{
								plugins: [
									{
										removeViewBox: false,
									},
								],
							},
						],
					],
				},
			}),
		);
	}
	return base;
};
const sourceMap = () => {
	if (isDev) {
		return "source-map";
	}
};

module.exports = {
	context: path.resolve(__dirname, "src"),
	mode: "development",
	entry: {
		main: ["@babel/polyfill", "./js/main.js"],
	},
	output: {
		filename: `./js/${filename("js")}`,
		path: path.resolve(__dirname, "dist"),
		publicPath: "",
	},
	resolve: {
		alias: {
			// "@models": path.resolve(__dirname, "src/models"),
			"@img": path.resolve(__dirname, "src/img"),
			"@": path.resolve(__dirname, "src"),
		},
	},
	optimization: optimization(),
	devServer: {
		host: '192.168.1.5',
		historyApiFallback: true,
		open: true,
		compress: true,
		hot: true,
		port: 3000,
		contentBase: path.resolve(__dirname, "dist"),
	},
	target: isDev ? "web" : "browserslist",
	devtool: sourceMap(),
	plugins: plugins(),
	module: {
		rules: [
			{
				test: /\.pug$/,
				loader: 'pug-loader'
			},
			{
				test: /\.html$/,
				loader: "html-loader",
			},
			{
				test: /\.css$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: isDev,
						},
					},
					"css-loader",
				],
			},
			{
				test: /\.s[ac]ss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							publicPath: (resourcePath, context) => {
								return (
									path.relative(
										path.dirname(resourcePath),
										context,
									) + "/"
								);
							},
						},
					},
					"css-loader",
					"sass-loader",
				],
			},
			{
				test: /\.(?:|gif|png|jpg|jpeg|svg)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: `./img/${filename("[ext]")}`,
							esModule: false,
						},
					},
				],
			},
			{
				test: /\.(ttf|woff|woff2|eot)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: `./fonts/${filename("[ext]")}`,
						},
					},
				],
			},
			// {
			// 	test: /\.xml$/,
			// 	use: ["xml-loader"],
			// },
			// {
			// 	test: /\.csv$/,
			// 	use: ["csv-loader"],
			// },
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: jsLoaders(),
			},
		],
	},
};
