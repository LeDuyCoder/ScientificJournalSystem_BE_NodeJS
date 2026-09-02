import prisma from '../../lib/prisma.js';

const normalizeCoinPackage = (coinPackage) => ({
    ...coinPackage,
    coin_amount: Number(coinPackage.coin_amount || 0),
    bonus_coin: Number(coinPackage.bonus_coin || 0),
    total_coin: Number(coinPackage.coin_amount || 0) + Number(coinPackage.bonus_coin || 0),
    price: coinPackage.price === null || coinPackage.price === undefined
        ? coinPackage.price
        : Number(coinPackage.price),
});

export const getActiveCoinPackages = async () => {
    const packages = await prisma.coin_package.findMany({
        where: { is_active: true },
        orderBy: [
            { price: 'asc' },
            { coin_amount: 'asc' }
        ]
    });
    return packages.map(normalizeCoinPackage);
};

export const getAdminCoinPackages = async ({ limit, offset, isActive }) => {
    const where = {};
    if (isActive !== undefined) {
        where.is_active = isActive;
    }

    const [total, items] = await Promise.all([
        prisma.coin_package.count({ where }),
        prisma.coin_package.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limit
        })
    ]);

    return { items: items.map(normalizeCoinPackage), total };
};

export const createCoinPackage = async (data) => {
    const coinPackage = await prisma.coin_package.create({
        data: {
            name: data.name.trim(),
            coin_amount: data.coin_amount,
            bonus_coin: data.bonus_coin || 0,
            price: data.price,
            currency: data.currency || 'VND',
            is_active: data.is_active !== undefined ? data.is_active : true,
        }
    });
    return normalizeCoinPackage(coinPackage);
};

export const updateCoinPackage = async (packageId, data) => {
    const allowedFields = ['name', 'coin_amount', 'bonus_coin', 'price', 'currency', 'is_active'];
    const updateData = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = field === 'name' && typeof data[field] === 'string' ? data[field].trim() : data[field];
        }
    }

    if (Object.keys(updateData).length === 0) {
        const error = new Error('Khong co du lieu cap nhat goi coin');
        error.statusCode = 400;
        error.code = 'NO_UPDATE_FIELDS';
        throw error;
    }

    updateData.updated_at = new Date();

    try {
        const coinPackage = await prisma.coin_package.update({
            where: { package_id: packageId },
            data: updateData
        });
        return normalizeCoinPackage(coinPackage);
    } catch (err) {
        if (err.code === 'P2025') {
            const error = new Error('Khong tim thay goi coin');
            error.statusCode = 404;
            error.code = 'COIN_PACKAGE_NOT_FOUND';
            throw error;
        }
        throw err;
    }
};

export const deactivateCoinPackage = async (packageId) => {
    try {
        const coinPackage = await prisma.coin_package.update({
            where: { package_id: packageId },
            data: {
                is_active: false,
                updated_at: new Date()
            }
        });
        return normalizeCoinPackage(coinPackage);
    } catch (err) {
        if (err.code === 'P2025') {
            const error = new Error('Khong tim thay goi coin');
            error.statusCode = 404;
            error.code = 'COIN_PACKAGE_NOT_FOUND';
            throw error;
        }
        throw err;
    }
};
