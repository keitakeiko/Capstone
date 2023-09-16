'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate (models) {
      Class.belongsTo(models.User, { foreignKey: 'teacherId' })
      Class.hasMany(models.Enrollment, { foreignKey: 'classId' })
    }
  }
  Class.init({
    teacherId: DataTypes.INTEGER,
    className: DataTypes.STRING,
    spendTime: DataTypes.INTEGER,
    teachingStyle: DataTypes.TEXT,
    availableTime: DataTypes.DATE,
    classDetail: DataTypes.TEXT,
    classUrl: DataTypes.STRING,
    avatar: DataTypes.STRING
  },{
    sequelize,
    modelName: 'Class',
    tableName: 'Classes',
    underscored: true,
  })
  return Class
};