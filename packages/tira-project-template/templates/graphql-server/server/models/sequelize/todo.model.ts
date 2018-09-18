export default (sequelize: any, DataTypes: any) => {
  const Model = sequelize.define(
    'Todo',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      content: {
        comment: 'todo content',
        type: DataTypes.STRING,
        defaultValue: false,
      },
    },
    {
      freezeTableName: true,
      paranoid: true,
    },
  );

  Model.comment = 'Todo';
  Model.associate = ({}) => {
    //
  };

  return Model;
};
