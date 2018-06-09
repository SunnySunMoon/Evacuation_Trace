

//drawGrid('lightgray', 10, 10);
const buildingMap = new BuildingMap('canvas', 10);
var mapData = [];
ajax('./data/BUILDING_DATA.txt')
	.then(str => {
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
		buildingMap.saveData();
		//保存当前数据
	})
	.catch(err => {
		console.log(err);
	});

let personData = [];
const personDataPromise = ajax('./data/OCCUPANTS_RFID_ASSIGNMENTS.txt');
personDataPromise
	.then(str => {
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

		for(let i=0; i<82; i++) {
			buildingMap.drawCircle(locationData[i].x, locationData[i].y, 4);
		}
	})
