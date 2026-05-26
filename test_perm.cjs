const { Role, Permission, User } = require('./backend/src/models');

async function test() {
  const user = await User.findOne({
    where: { email: 'user1@gmail.com' },
    include: {
      model: Role,
      include: Permission
    }
  });

  if (user) {
    console.log('User Role:', user.Role.name);
    console.log('User Permissions:', user.Role.Permissions.map(p => p.name));
  } else {
    console.log('User not found');
  }
}

test();
