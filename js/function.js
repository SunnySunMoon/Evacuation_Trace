//将轨迹数据按帧拆分
function timeFrameSplit (arr) {
	let temp = [];
	let index = -1;
	let timeIdx = [];
	arr.forEach( x => {
		if(! timeIdx.includes(x.frame)) {
			timeIdx.push(x.frame);
			temp[++index] = [];
			temp[index].push(x);
		} else {
			temp[index].push(x);
		}
	});
	return temp;
}
//将轨迹数据按人员拆分
function personFrameSplit (arr, length) {
	let temp = [];
	//temp.fill([])将导致bug，所有成员指向同一个数组内存地址。
	for (let i=0; i<length; i++) {
		temp[i] = [];
	}
	arr.forEach(x => {
		temp[x.personNumber].push(x);
	});
	return temp;
}

//构造人名dom
function changePersonList (parentId, domList, changedList, method) {
  const parent = document.getElementById(parentId);
  if (method === 'add') {
    changedList.forEach(x => {
      let dom = document.createElement('div');
      dom.classList.add('space-list-item');
			dom.textContent = x + '  ' + personData[x].name;
			let flag = true;
      for (let i=0; i<domList.length; i++) {
				if (x < domList[i].num) {
					domList.splice(i, 0, {
						dom,
						num: x
					});
					flag = false;
					parent.insertBefore(dom,domList[i+1].dom);
					break;
				}
			}
			if (flag) {
				domList.push({
					dom,
					num: x,
				});
				parent.appendChild(dom);
			}
    });
  } else if (method === 'remove') {
		changedList.forEach(x => {
			let removeDom = null;
			for (let i=0; i<domList.length; i++) {
				if (domList[i].num === x) {
					[removeDom] = domList.splice(i, 1);
					break;
				}
			}
			parent.removeChild(removeDom.dom);		
		})
	}
}