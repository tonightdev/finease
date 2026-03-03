import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Delete,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@common/guards/auth.guard';
import { GoalService } from '@finance/goal.service';
import { ReconciliationService } from '@finance/reconciliation.service';
import { AccountsService } from '@finance/accounts.service';
import { TransactionsService } from '@finance/transactions.service';
import { CategoriesService } from '@finance/categories.service';
import { AssetClassesService } from '@finance/asset-classes.service';
import type {
  FinancialGoal,
  Transaction,
  Account,
  User,
  Category,
  AssetClass,
} from '@repo/types';
import { UsersService } from '@common/services/users.service';
import type { RequestWithUser } from '@common/interfaces/request.interface';

@ApiTags('Finance')
@ApiBearerAuth('bearer')
@Controller('finance')
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(
    private readonly goalService: GoalService,
    private readonly reconciliationService: ReconciliationService,
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly categoriesService: CategoriesService,
    private readonly assetClassesService: AssetClassesService,
    private readonly usersService: UsersService,
  ) {}

  // --- Profile ---

  @ApiOperation({ summary: 'Get current user profile metadata' })
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    return this.usersService.findOne(req.user.uid);
  }

  @ApiOperation({ summary: 'Update user profile details' })
  @Put('profile')
  updateProfile(@Req() req: RequestWithUser, @Body() data: Partial<User>) {
    return this.usersService.update(req.user.uid, data);
  }

  // --- Accounts ---

  @ApiOperation({ summary: 'List all financial accounts for user' })
  @Get('accounts')
  findAllAccounts(@Req() req: RequestWithUser) {
    return this.accountsService.findAll(req.user.uid);
  }

  @ApiOperation({ summary: 'Create a new financial account' })
  @Post('accounts')
  createAccount(
    @Req() req: RequestWithUser,
    @Body() account: Partial<Account>,
  ) {
    return this.accountsService.create({ ...account, userId: req.user.uid });
  }

  @ApiOperation({ summary: 'Update an existing account' })
  @Put('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() account: Partial<Account>) {
    return this.accountsService.update(id, account);
  }

  @ApiOperation({ summary: 'Delete a financial account' })
  @Delete('accounts/:id')
  removeAccount(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }

  // --- Transactions ---

  @ApiOperation({ summary: 'List all transactions for user' })
  @Get('transactions')
  findAllTransactions(@Req() req: RequestWithUser) {
    return this.transactionsService.findAll(req.user.uid);
  }

  @ApiOperation({ summary: 'Create a new transaction' })
  @Post('transactions')
  createTransaction(
    @Req() req: RequestWithUser,
    @Body() transaction: Partial<Transaction>,
  ) {
    return this.transactionsService.create({
      ...transaction,
      userId: req.user.uid,
    });
  }

  @ApiOperation({ summary: 'Update an existing transaction' })
  @Put('transactions/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() transaction: Partial<Transaction>,
  ) {
    return this.transactionsService.update(id, transaction);
  }

  @ApiOperation({ summary: 'Delete a transaction' })
  @Delete('transactions/:id')
  removeTransaction(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }

  @ApiOperation({ summary: 'Confirm a pending automated transaction' })
  @Post('transactions/:id/confirm')
  confirmTransaction(@Param('id') id: string) {
    return this.transactionsService.confirm(id);
  }

  // --- Goals ---

  @ApiOperation({ summary: 'List all financial goals for user' })
  @Get('goals')
  findAllGoals(@Req() req: RequestWithUser) {
    return this.goalService.findAll(req.user.uid);
  }

  @ApiOperation({ summary: 'Create a new financial goal' })
  @Post('goals')
  createGoal(
    @Req() req: RequestWithUser,
    @Body() goal: Partial<FinancialGoal>,
  ) {
    return this.goalService.create({ ...goal, userId: req.user.uid });
  }

  @ApiOperation({ summary: 'Update an existing goal' })
  @Put('goals/:id')
  updateGoal(@Param('id') id: string, @Body() goal: Partial<FinancialGoal>) {
    return this.goalService.update(id, goal);
  }

  @ApiOperation({ summary: 'Delete a financial goal' })
  @Delete('goals/:id')
  removeGoal(@Param('id') id: string) {
    return this.goalService.remove(id);
  }

  @ApiOperation({ summary: 'Calculate monthly savings requirement for a goal' })
  @Post('goal/requirement')
  getMonthlyRequirement(@Body() goal: FinancialGoal) {
    return {
      monthlyRequirement: this.goalService.calculateMonthlyRequirement(goal),
      health: this.goalService.getGoalHealth(goal),
    };
  }

  // --- Categories ---

  @ApiOperation({ summary: 'List all categories for user' })
  @Get('categories')
  findAllCategories(@Req() req: RequestWithUser) {
    return this.categoriesService.findAll(req.user.uid);
  }

  @ApiOperation({ summary: 'Create a new expense category' })
  @Post('categories')
  createCategory(
    @Req() req: RequestWithUser,
    @Body() category: Partial<Category>,
  ) {
    return this.categoriesService.create({ ...category, userId: req.user.uid });
  }

  @ApiOperation({ summary: 'Update an existing category' })
  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() category: Partial<Category>) {
    return this.categoriesService.update(id, category);
  }

  @ApiOperation({ summary: 'Delete a category' })
  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // --- Asset Classes ---

  @ApiOperation({ summary: 'List all asset classes for user' })
  @Get('asset-classes')
  findAllAssetClasses(@Req() req: RequestWithUser) {
    return this.assetClassesService.findAll(req.user.uid);
  }

  @ApiOperation({ summary: 'Create a new asset class' })
  @Post('asset-classes')
  createAssetClass(
    @Req() req: RequestWithUser,
    @Body() assetClass: Partial<AssetClass>,
  ) {
    return this.assetClassesService.create({
      ...assetClass,
      userId: req.user.uid,
    });
  }

  @ApiOperation({ summary: 'Update an asset class' })
  @Put('asset-classes/:id')
  updateAssetClass(
    @Param('id') id: string,
    @Body() assetClass: Partial<AssetClass>,
  ) {
    return this.assetClassesService.update(id, assetClass);
  }

  @ApiOperation({ summary: 'Delete an asset class' })
  @Delete('asset-classes/:id')
  removeAssetClass(@Param('id') id: string) {
    return this.assetClassesService.remove(id);
  }

  // --- Reconciliation ---

  @ApiOperation({ summary: 'Reconcile a specific transaction' })
  @Post('reconcile/:id')
  reconcileTransaction(
    @Param('id') id: string,
    @Body('transactions') transactions: Transaction[],
  ) {
    return this.reconciliationService.reconcile(id, transactions);
  }

  @ApiOperation({ summary: 'Get list of pending reconciliations' })
  @Post('reconcile/pending')
  getPendingReconciliations(@Body('transactions') transactions: Transaction[]) {
    return this.reconciliationService.findUnreconciledWithdrawals(transactions);
  }
}
