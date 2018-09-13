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
const spaceReverseButton = document.getElementById('stain-space-reverse');

var stainArea = []; //声明用来保存染色区域的数组
var spaceNumList = []; //保存档当前染色空间所有人员序号的数组
var spaceChangedList = []; //保存本次需操作DOM的序号数组
var spaceDomList = [];
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
		color: 'rgba(0,0,255,0.2)',
		people: [],  //保存被染色人员序号
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
	stainPersonOnSpace();
	//向本次需操作DOM的序号数组中写入全新的序号
	spaceChangedList = [];
	stainArea[stainArea.length-1].people.forEach(x => {
		if (!spaceNumList.includes(x)) {
			spaceChangedList.push(x);
		}
	});

	changePersonList('space-list-content', spaceDomList, spaceChangedList, 'add');

	//向染色空间所有人员序号的数组添加新区域中的所有序号
	spaceNumList = spaceNumList.concat([...stainArea[stainArea.length-1].people]);

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
		const people = stainArea.pop().people;
		spaceChangedList = []; //重置改变数组，准备保存本次操作需要的序号
		people.forEach(x => {
			spaceNumList.splice(spaceNumList.indexOf(x),1); //先删除一次
			//若剩余没有该值则可推入改变数组并修改对应人员的color
			if (!spaceNumList.includes(x)) {
				mainMap.personColor[x] = 'white';
				spaceChangedList.push(x);
			}
		});
		//撤销染色名单
		changePersonList('space-list-content', spaceDomList, spaceChangedList, 'remove');
		mainMap.drawFrame(controller.getCurrentFrame());
	}	
});
//清空按钮绑定点击事件
emptyButton.addEventListener('click', e => {
	const data = stainMap.statusArr[0];
	stainMap.statusArr = [];
	stainArea = [];
	stainMap.imageData = data;
	stainMap.restoreData();
	mainMap.personColor.forEach((x,i,arr) => {
		arr[i] = 'white';
	});
	//清空空间染色DOM数组及名单
	spaceDomList = [];
	document.getElementById('space-list-content').innerHTML = '';

	mainMap.drawFrame(controller.getCurrentFrame());
});

//翻转空域染色名单
spaceReverseButton.addEventListener('click', e => {
	const reversed = [...personData];
	let offset = 0;
	spaceDomList.forEach(x => {
		reversed.splice(x.num-offset, 1);
		mainMap.personColor[x.num] = 'white';
		offset++;
	});
	const reversedNum = reversed.map(x => parseInt(x.number));
	reversedNum.forEach(x => {
		mainMap.personColor[x] = 'rgba(0, 255, 0, 0.8)';
	})
	//清空空间染色DOM数组及名单
	spaceDomList = [];
	document.getElementById('space-list-content').innerHTML = '';
	//添加翻转
	changePersonList('space-list-content',spaceDomList,reversedNum, 'add');
	mainMap.drawFrame(controller.getCurrentFrame());
})

//根据stainArea对象数组改变localFrameData中对应人员的颜色属性
function stainPersonOnSpace () {
	const area = stainArea[stainArea.length - 1];
	personFrameData.forEach(person => {
		for (let i=0; i<person.length; i++) {
			if (person[i].x >= area.start.x && person[i].x <= area.end.x
				&& person[i].y >= area.start.y && person[i].y <= area.end.y) {
					mainMap.personColor[person[i].personNumber] = area.color;
					area.people.push(person[i].personNumber);
					break;
				}
		}
	});
}

