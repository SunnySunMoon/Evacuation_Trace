const canvas = document.getElementById('canvas');
const stainCanvas = document.getElementById('stain-canvas');
//绘制网格地图
const mainMap = new BuildingMap('canvas', 8);
const stainMap = new BuildingMap('stain-canvas', 8);
var   $ = (id) => document.getElementById(id);
var   timeZone = null; //用于保存时域染色实例的全局变量
var   spaceZone = null; //用于保存空域染色实例的全局变量
var mapData = [];
//获取建筑地图原始数据并绘制地图
ajax('./data/BUILDING_DATA.txt').then(str => {
	//以正则匹配的方式剔除换行
	let strArr = str.replace(/[\r\n]/g, "").trim().split(' ');
	let mapArr = [];
	for (let i=0; i<strArr.length;) {  
		let row = [];
		for (let j=0; j<91; j++) {
			row.push(strArr[i]);
			i++;
		}
		mapArr.push(row);
	}
	mapArr.reverse(); //数据本身有误，行需要倒置一次
	mapData = mapArr;
	mainMap.fromData(mapArr);
	mainMap.saveData(); //地图一旦生成就不会变动，因此保存为背景
	//保存当前数据
}).catch(err => {
	console.log(err);
});


let personData = [];
//获取人员编号与姓名对应关系数据，并保存到全局变量备用。
const personDataPromise = ajax('./data/OCCUPANTS_RFID_ASSIGNMENTS.txt');
personDataPromise.then(str => {
	let strArr = str.trim().split('\r\n');
	//删除头尾两行无关内容
	strArr.pop();
	strArr.shift();
	personData = strArr.map(x => {
		let [number, name] = x.trim().split('\t');
		return {
			number,
			name,
		}
	});
	mainMap.personColor = new Array(personData.length).fill('white');
	strArr = null;
});


let locationData = []; //全时间全人员数据数组
let localFrameData = []; //按帧分割数据数组
let personFrameData = []; //按人员分割数据数组
let controller = null;
let timer = null;
//获取所有时间人员移动数据
const locationDataPromise = ajax('./data/RFID_PATHWAY_DATA_v2.txt');
locationDataPromise.
	then(str => {
		let strArr = str.trim().split('\r\n');
		//删除第一行字段行
		strArr.shift(); 
		locationData = strArr.map(item => {
			let [frame, personNumber, x, y] = item.trim().split('\t').map(x => parseInt(x));
			return {
				frame,
				personNumber,
				x,
				y,
			}
		});
		//按帧分割
		localFrameData = timeFrameSplit(locationData);
		personFrameData = personFrameSplit(locationData, personData.length);
		//初始化控制器与显示
		controller = new Controller ('controls', localFrameData, 70);
		controller.registerPlugins(
			pluginProcessBar,
			pluginPrevious, 
			plugiNext, 
			pluginStart); 
		mainMap.drawFrame(controller.getCurrentFrame());
		//mousemove激活悬浮窗
		mainMap.canvas.addEventListener('mousemove', evt => {
			let idx = controller.getCurrentIdx();
			mainMap.hoverBox(evt.pageX, evt.pageY, localFrameData[idx]);
		});
		//定义一个绘图函数，作为action传入时域染色构造函数中
		let action = function (colors) {
			mainMap.drawFrame(controller.getCurrentFrame(), colors);
		}
		//创建空域染色实例并绑定功能按钮
		spaceZone = new SpaceZone(
			'stain-canvas',
			personFrameData,
			mainMap.step+1,
			action);
		spaceZone.bindStain($('stain-button'));
		spaceZone.bindUndo($('stain-undo'));
		spaceZone.bindEmpty($('stain-empty'));
		spaceZone.bindExit($('space-exit'));
		spaceZone.bindListDom($('space-list-content'), personData);
		spaceZone.bindReverseList($('space-list-reverse'));
		spaceZone.canvas.addEventListener('mousemove', e => {
			let idx = controller.getCurrentIdx();
			mainMap.hoverBox(e.pageX, e.pageY, localFrameData[idx]);
		})
		//创建时域染色实例并绑定功能按钮
		timeZone = new TimeZone('time-zone', personFrameData, action);
		timeZone.bindStain($('time-stain'));
		timeZone.bindExit($('time-exit'));
		timeZone.bindUndo($('time-undo'));
		timeZone.bindEmpty($('time-empty'));
		timeZone.bindListDom($('time-list-content'), personData);
		timeZone.bindReverseList($('time-list-reverse'));
	});



