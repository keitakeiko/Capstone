'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate(models) {
      Class.belongsTo(models.User, { foreignKey: 'teacherId' })
      Class.hasMany(models.Enrollment, { foreignKey: 'classId' })
    }
  }
  Class.init({
    teacherId: DataTypes.INTEGER,
    spendTime: DataTypes.INTEGER,
    teachingStyle: DataTypes.TEXT,
    classUrl: DataTypes.STRING,
    introduction: DataTypes.STRING,
    availableDay: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Class',
    tableName: 'Classes'
  })
  return Class
};