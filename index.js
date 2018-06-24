const canvas = document.getElementById('canvas');
//绘制网格地图
const buildingMap = new BuildingMap('canvas', 10);
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
	buildingMap.fromData(mapArr);
	buildingMap.saveData(); //地图一旦生成就不会变动，因此保存为背景
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
	strArr = null;
});


let locationData = [];
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
			let [frame, personNumber, x, y] = item.trim().split('\t');
			x = parseInt(x);
			y = parseInt(y);
			return {
				frame,
				personNumber,
				x,
				y,
			}
		});

		//按帧分割
		localtionData = timeFrameSplit(locationData, 'frame');
		//初始化控制器与显示
		controller = new Controller ('controls', localtionData, 70);
		controller.registerPlugins(pluginPrevious, 
			plugiNext, 
			pluginStart, 
			pluginProcessBar);
		buildingMap.drawFrame(controller.getCurrentFrame());
	});

//将时间段数据按时间段拆分
function timeFrameSplit (arr, prop) {
	let temp = [];
	let index = -1;
	let timeIdx = [];
	arr.forEach( x => {
		if(! timeIdx.includes(x[prop])) {
			timeIdx.push(x[prop]);
			temp[++index] = [];
			temp[index].push(x);
		} else {
			temp[index].push(x);
		}
	});
	return temp;
}

//绘制一帧
function drawTimeFrame (timeFrame) {
	
} 