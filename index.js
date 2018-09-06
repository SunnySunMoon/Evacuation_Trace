const canvas = document.getElementById('canvas');
const stainCanvas = document.getElementById('stain-canvas');
//绘制网格地图
const mainMap = new BuildingMap('canvas', 10);
const stainMap = new BuildingMap('stain-canvas', 10);
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
		localFrameData = timeFrameSplit(locationData, 'frame');
		//初始化控制器与显示
		controller = new Controller ('controls', localFrameData, 70);
		controller.registerPlugins(
			pluginProcessBar,
			pluginPrevious, 
			plugiNext, 
			pluginStart); 
		mainMap.drawFrame(controller.getCurrentFrame());
		//mousemove激活悬浮窗,因为stain层遮盖了地图和点层，因此不能直接把事件绑定到buildingMap
		//而应该绑定到stainMap上
		stainMap.canvas.addEventListener('mousemove', evt => {
			let idx = controller.getCurrentIdx();
			stainMap.hoverBox(evt.pageX, evt.pageY, localFrameData[idx]);
		});
	});



/* 染色相关代码 */

const stainButton = document.getElementById('stain-button');
const undoButton = document.getElementById('stain-undo');
const emptyButton = document.getElementById('stain-empty');

var stainArea = []; //声明用来保存染色区域的数组

//染色按钮绑定点击事件
stainButton.addEventListener('click', () => {
	stainMap.isStainMode = true;
});

stainCanvas.addEventListener('mousedown', evt => {
	stainMap.dragStatus = true;
	stainMap.saveData();
	stainMap.statusArr.push(stainMap.imageData);
	stainMap.start = stainMap.windowToCanvas(evt.pageX, evt.pageY);
	let area = {
		start: {
			x: Math.floor(stainMap.start.x / (stainMap.step + 1)),
			y: Math.floor(stainMap.start.y / (stainMap.step + 1))
		},
		end: {},
		color: 'rgba(0,0,255,0.2)'
	}
	stainArea.push(area);
});
stainCanvas.addEventListener('mousemove', evt => {
	let loc = stainMap.windowToCanvas(evt.pageX, evt.pageY);
	if (stainMap.dragStatus && stainMap.isStainMode) {
		stainArea[stainArea.length - 1].end = {
			x: Math.floor(loc.x / (stainMap.step + 1)) - 1,
			y: Math.floor(loc.y / (stainMap.step + 1)) - 1
		}
		stainMap.ctx.fillStyle = 'rgba(0,0,255,0.2)';
		stainMap.restoreData();
		stainMap.end = loc;
		stainMap.drawRectGrid(stainMap.start, loc);
	}
});
stainCanvas.addEventListener('mouseup', evt => {
	stainMap.dragStatus = false;
	stainPerson();
	mainMap.drawFrame(controller.getCurrentFrame());
});
stainCanvas.addEventListener('mouseout', evt => {
	stainMap.dragStatus = false;
})

//撤销按钮绑定点击事件
undoButton.addEventListener('click', e => {
	const data = stainMap.statusArr.pop();
	if (data != undefined) {
		stainMap.imageData = data;
		stainMap.restoreData();
		stainArea.pop();
	}
});
//清空按钮绑定点击事件
emptyButton.addEventListener('click', e => {
	const data = stainMap.statusArr[0];
	stainMap.statusArr = [];
	stainArea = [];
	stainMap.imageData = data;
	stainMap.restoreData();
})

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

//根据stainArea对象数组改变localFrameData中对应人员的颜色属性
function stainPerson () {
	stainArea.forEach(area => {
		for (let i=0; i<localFrameData.length; i++) {
			localFrameData[i].forEach(person => {
				if (person.x >= area.start.x && person.x <= area.end.x
					&& person.y >= area.start.y && person.y <= area.end.y) {
						mainMap.personColor[person.personNumber] = area.color;
					}
			})
		}
	})
}

