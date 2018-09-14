class Canvas {
  constructor (id) {
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.statusArr = []; //用于保存绘图状态的数组
  } 
  //窗口坐标转换为canvas坐标
  windowToCanvas (x, y) {
    let box = this.canvas.getBoundingClientRect();
    //减去border
    return {
      x: x - box.left - (box.width - this.canvas.width)/2 - window.pageXOffset,
      y: y - box.top  - (box.height - this.canvas.height)/2 - window.pageYOffset
    }
  }
  saveData () {
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return this.imageData;
  }
  restoreData () {
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}