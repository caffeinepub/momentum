import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let MAX_TITLE_LENGTH = 20;
  let START_OFFSET = 1000;
  let MAX_ADMINS = 3;

  public type Id = Nat;
  public type PrincipalId = Principal;
  public type TaskId = Nat;
  public type ListId = Nat;
  public type RoutineId = Nat;
  public type SpendId = Nat;
  public type UserTier = {
    #basic;
    #silver;
    #gold;
    #diamond;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    earningsEnabled : Bool;
    tier : UserTier;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public type MonetarySettings = {
    maxMoneyPerDay : Nat;
    maxMorningRoutine : Nat;
    maxDailyPriorities : Nat;
    maxEveningRoutine : Nat;
    totalBalance : Int;
  };

  public type RoutineSection = {
    #top;
    #bottom;
  };

  public type MorningRoutine = {
    id : RoutineId;
    text : Text;
    completed : Bool;
    section : RoutineSection;
    order : Nat;
    streakCount : Nat;
    weight : Int;
  };

  public type Task = {
    id : TaskId;
    title : Text;
    description : Text;
    completed : Bool;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    weight : Float;
    listId : ListId;
    order : Nat;
  };

  public type TaskInput = {
    title : Text;
    description : Text;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    listId : ListId;
    order : Nat;
  };

  public type List = {
    id : ListId;
    name : Text;
    quadrant : Bool;
    urgent : Bool;
    important : Bool;
  };

  module List {
    public func compare(a : List, b : List) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type PayrollRecord = {
    date : Int;
    total : Int;
    submitted : Bool;
    details : {
      morning : Int;
      priorities : Int;
      evening : Int;
    };
  };

  public type TodayEarns = {
    total : Int;
    submitted : Bool;
    details : {
      morning : Int;
      priorities : Int;
      evening : Int;
    };
  };

  public type SpendType = {
    #normal;
    #preDeducted;
  };

  public type SpendRecord = {
    id : SpendId;
    date : Int;
    amount : Float;
    category : Text;
    spendType : SpendType;
  };

  public type SpendPreset = {
    id : Nat;
    name : Text;
    amount : Float;
    category : Text;
  };

  public type TaskUpdateInput = {
    title : Text;
    description : Text;
    completed : Bool;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    listId : ListId;
    order : Nat;
  };

  public type TaskCreateInput = {
    title : Text;
    description : Text;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    listId : ListId;
    order : Nat;
  };

  public type User = {
    lists : Map.Map<ListId, List>;
    tasks : Map.Map<TaskId, Task>;
    routines : Map.Map<RoutineId, MorningRoutine>;
    payrollHistory : Map.Map<Int, PayrollRecord>;
    spendRecords : Map.Map<SpendId, SpendRecord>;
    nextTaskId : TaskId;
    nextListId : ListId;
    nextRoutineId : RoutineId;
    nextSpendId : SpendId;
    lastResetDate : Int;
    monetarySettings : MonetarySettings;
    todayEarns : ?TodayEarns;
    principal : PrincipalId;
    earningsEnabled : Bool;
    spendPresets : Map.Map<Nat, SpendPreset>;
    nextPresetId : Nat;
  };

  let users = Map.empty<Principal, User>();

  // Tier limits configuration
  type TierLimits = {
    maxRoutines : ?Nat; // null means unlimited
    maxCustomLists : ?Nat;
    maxTasks : ?Nat;
    earningsAllowed : Bool;
  };

  func getTierLimits(tier : UserTier) : TierLimits {
    switch (tier) {
      case (#basic) {
        {
          maxRoutines = ?5;
          maxCustomLists = ?2;
          maxTasks = ?20;
          earningsAllowed = false;
        };
      };
      case (#silver) {
        {
          maxRoutines = ?10;
          maxCustomLists = ?5;
          maxTasks = ?50;
          earningsAllowed = true;
        };
      };
      case (#gold) {
        {
          maxRoutines = ?20;
          maxCustomLists = ?10;
          maxTasks = ?100;
          earningsAllowed = true;
        };
      };
      case (#diamond) {
        {
          maxRoutines = null; // unlimited
          maxCustomLists = null;
          maxTasks = null;
          earningsAllowed = true;
        };
      };
    };
  };

  func getUserTier(caller : Principal) : UserTier {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.tier };
      case (null) { #basic };
    };
  };

  func checkRoutineLimit(caller : Principal, user : User) {
    let tier = getUserTier(caller);
    let limits = getTierLimits(tier);
    switch (limits.maxRoutines) {
      case (?maxRoutines) {
        let currentCount = user.routines.size();
        if (currentCount >= maxRoutines) {
          Runtime.trap("You have reached the maximum number of routines (" # maxRoutines.toText() # ") for your tier. Please upgrade your tier to add more routines.");
        };
      };
      case (null) {}; // unlimited
    };
  };

  func checkCustomListLimit(caller : Principal, user : User) {
    let tier = getUserTier(caller);
    let limits = getTierLimits(tier);
    switch (limits.maxCustomLists) {
      case (?maxLists) {
        // Count custom lists (non-quadrant lists, excluding the 4 default quadrants)
        let customListCount = user.lists.values().toArray().filter(func(list : List) : Bool {
          not list.quadrant
        }).size();
        if (customListCount >= maxLists) {
          Runtime.trap("You have reached the maximum number of custom lists (" # maxLists.toText() # ") for your tier. Please upgrade your tier to add more lists.");
        };
      };
      case (null) {}; // unlimited
    };
  };

  func checkTaskLimit(caller : Principal, user : User) {
    let tier = getUserTier(caller);
    let limits = getTierLimits(tier);
    switch (limits.maxTasks) {
      case (?maxTasks) {
        let currentCount = user.tasks.size();
        if (currentCount >= maxTasks) {
          Runtime.trap("You have reached the maximum number of tasks (" # maxTasks.toText() # ") for your tier. Please upgrade your tier to add more tasks.");
        };
      };
      case (null) {}; // unlimited
    };
  };

  func checkEarningsAccess(caller : Principal) {
    let tier = getUserTier(caller);
    let limits = getTierLimits(tier);
    if (not limits.earningsAllowed) {
      Runtime.trap("The earnings system is not available for your tier. Please upgrade to Silver tier or higher to access earnings features.");
    };
  };

  func addQuadrantIfMissing(user : User, id : ListId, name : Text, urgent : Bool, important : Bool) {
    if (not user.lists.containsKey(id)) {
      let quadrant : List = {
        id;
        name;
        quadrant = true;
        urgent;
        important;
      };
      user.lists.add(id, quadrant);
    };
  };

  func initializeAllQuadrantsInternal(user : User) {
    addQuadrantIfMissing(user, 1, "Must Do", true, true);
    addQuadrantIfMissing(user, 2, "Should Do", false, true);
    addQuadrantIfMissing(user, 3, "Delegate / Could Do", true, false);
    addQuadrantIfMissing(user, 4, "May Do", false, false);
  };

  func createEmptyUser(principal : PrincipalId) : User {
    {
      lists = Map.empty<ListId, List>();
      tasks = Map.empty<TaskId, Task>();
      routines = Map.empty<RoutineId, MorningRoutine>();
      payrollHistory = Map.empty<Int, PayrollRecord>();
      spendRecords = Map.empty<SpendId, SpendRecord>();
      nextTaskId = 0;
      nextListId = 5;
      nextRoutineId = 0;
      nextSpendId = 1;
      lastResetDate = 0;
      monetarySettings = {
        maxMoneyPerDay = 0;
        maxMorningRoutine = 0;
        maxDailyPriorities = 0;
        maxEveningRoutine = 0;
        totalBalance = 0;
      };
      todayEarns = null;
      principal;
      earningsEnabled = false;
      spendPresets = Map.empty<Nat, SpendPreset>();
      nextPresetId = 1;
    };
  };

  func getOrCreateUserInternal(caller : Principal) : User {
    switch (users.get(caller)) {
      case (?user) {
        initializeAllQuadrantsInternal(user);
        user;
      };
      case (null) {
        let newUser = createEmptyUser(caller);

        let weekList : List = {
          id = newUser.nextListId;
          name = "Week";
          quadrant = false;
          urgent = false;
          important = false;
        };
        newUser.lists.add(newUser.nextListId, weekList);

        let monthList : List = {
          id = newUser.nextListId + 1;
          name = "Month";
          quadrant = false;
          urgent = false;
          important = false;
        };
        newUser.lists.add(newUser.nextListId + 1, monthList);

        let updatedUser = {
          newUser with
          nextListId = newUser.nextListId + 2;
        };

        users.add(caller, updatedUser);
        initializeAllQuadrantsInternal(updatedUser);

        if (userProfiles.get(caller) == null) {
          let defaultProfile : UserProfile = {
            name = "";
            email = null;
            earningsEnabled = false;
            tier = #basic;
          };
          userProfiles.add(caller, defaultProfile);
        };

        updatedUser;
      };
    };
  };

  func getUser(caller : Principal) : User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access user data");
    };
    getOrCreateUserInternal(caller);
  };

  func withUser(caller : Principal, f : User -> ()) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access user data");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { f(user) };
    };
  };

  public shared ({ caller }) func ensureAllQuadrants() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getOrCreateUserInternal(caller);
    initializeAllQuadrantsInternal(user);
  };

  func needsRecalculation(tasks : [Task]) : Bool {
    if (tasks.size() < 2) { return false };
    var i = 1;
    while (i < tasks.size()) {
      let prev = tasks[i - 1];
      let curr = tasks[i];
      if (curr.order <= prev.order or (Int.abs(curr.order.toInt() - prev.order.toInt()) < 1)) {
        return true;
      };
      i += 1;
    };
    false;
  };

  func recalculateOrders(user : User, listId : ListId) {
    let tasksArray = user.tasks.values().toArray().filter(func(t) { t.listId == listId }).sort(
      func(a : Task, b : Task) : Order.Order { Nat.compare(a.order, b.order) }
    );
    let numTasks = tasksArray.size();
    if (numTasks <= 1) { return };

    var i = 0;
    while (i < numTasks) {
      let newOrder = (i + 1) * START_OFFSET;
      let task = tasksArray[i];
      let updatedTask = { task with order = newOrder };
      user.tasks.add(task.id, updatedTask);
      i += 1;
    };
  };

  public shared ({ caller }) func updateTaskPosition(taskId : TaskId, positionIndex : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.tasks.get(taskId)) {
          case (null) { Runtime.trap("Task not found") };
          case (?task) {
            let sortedTasks = user.tasks.values().toArray().filter(func(t) { t.listId == task.listId }).sort(
              func(a : Task, b : Task) : Order.Order { Nat.compare(a.order, b.order) }
            );
            let numTasks = sortedTasks.size();

            let newOrder = if (numTasks == 0) {
              START_OFFSET;
            } else if (positionIndex >= numTasks) {
              let lastTask = sortedTasks[numTasks - 1];
              lastTask.order + START_OFFSET;
            } else if (positionIndex == 0) {
              let firstTask = sortedTasks[0];
              if (firstTask.order > 1) {
                firstTask.order / 2;
              } else {
                START_OFFSET;
              };
            } else {
              let beforeTask = sortedTasks[positionIndex - 1];
              let afterTask = sortedTasks[positionIndex];
              (beforeTask.order + afterTask.order) / 2;
            };

            if (numTasks > 1 and needsRecalculation(sortedTasks)) {
              recalculateOrders(user, task.listId);
            };

            let updatedTask = { task with order = newOrder };
            user.tasks.add(taskId, updatedTask);
          };
        };
      },
    );
  };

  public shared ({ caller }) func reorderTask(taskId : TaskId, newPosition : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    await updateTaskPosition(taskId, newPosition);
  };

  func calculateTaskWeight(important : Bool, urgent : Bool, isLongTask : Bool) : Float {
    var weight : Float = 1.0;
    if (important) { weight += 2.0 };
    if (urgent) { weight += 1.5 };
    if (isLongTask) { weight += 2.0 };
    weight;
  };

  public shared ({ caller }) func createTask(input : TaskCreateInput) : async TaskId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    
    // Enforce tier-based task limit
    checkTaskLimit(caller, user);
    
    if (input.title.size() > MAX_TITLE_LENGTH) {
      Runtime.trap("Title can't exceed " # MAX_TITLE_LENGTH.toText() # " characters");
    };
    if (not user.lists.containsKey(input.listId)) {
      Runtime.trap("List does not exist");
    };
    let task : Task = {
      input with
      id = user.nextTaskId;
      completed = false;
      weight = calculateTaskWeight(input.important, input.urgent, input.isLongTask);
    };
    user.tasks.add(user.nextTaskId, task);
    let updatedUser = { user with nextTaskId = user.nextTaskId + 1 };
    users.add(caller, updatedUser);
    task.id;
  };

  public shared ({ caller }) func updateTask(id : TaskId, updatedTask : TaskUpdateInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    if (updatedTask.title.size() > MAX_TITLE_LENGTH) {
      Runtime.trap("Title can't exceed " # MAX_TITLE_LENGTH.toText() # " characters");
    };
    withUser(
      caller,
      func(user) {
        if (not user.lists.containsKey(updatedTask.listId)) {
          Runtime.trap("List does not exist");
        };
        switch (user.tasks.get(id)) {
          case (null) { Runtime.trap("Task not found") };
          case (?oldTask) {
            let task : Task = {
              updatedTask with
              id;
              completed = oldTask.completed;
              weight = calculateTaskWeight(updatedTask.important, updatedTask.urgent, updatedTask.isLongTask);
            };
            user.tasks.add(id, task);
          };
        };
      },
    );
  };

  public shared ({ caller }) func deleteTask(id : TaskId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.tasks.get(id)) {
          case (null) { Runtime.trap("Task not found") };
          case (?_) { user.tasks.remove(id) };
        };
      },
    );
  };

  public shared ({ caller }) func moveTask(taskId : TaskId, destinationListId : ListId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.tasks.get(taskId)) {
          case (null) { Runtime.trap("Task not found") };
          case (?task) {
            switch (user.lists.get(destinationListId)) {
              case (null) { Runtime.trap("Destination list does not exist") };
              case (?destList) {
                let updatedTask = {
                  task with
                  listId = destinationListId;
                  urgent = destList.urgent;
                  important = destList.important;
                  weight = calculateTaskWeight(destList.important, destList.urgent, task.isLongTask);
                };
                user.tasks.add(taskId, updatedTask);
              };
            };
          };
        };
      },
    );
  };

  public shared ({ caller }) func completeTask(id : TaskId, completed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.tasks.get(id)) {
          case (null) { Runtime.trap("Task not found") };
          case (?task) {
            let updatedTask = { task with completed };
            user.tasks.add(id, updatedTask);
          };
        };
      },
    );
  };

  public shared ({ caller }) func createList(name : Text) : async ListId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    
    // Enforce tier-based custom list limit
    checkCustomListLimit(caller, user);
    
    let list : List = {
      id = user.nextListId;
      name;
      quadrant = false;
      urgent = false;
      important = false;
    };
    user.lists.add(user.nextListId, list);
    let updatedUser = { user with nextListId = user.nextListId + 1 };
    users.add(caller, updatedUser);
    list.id;
  };

  public shared ({ caller }) func deleteList(id : ListId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.lists.get(id)) {
          case (null) { Runtime.trap("List not found") };
          case (?list) {
            if (list.quadrant) { Runtime.trap("Cannot delete quadrant lists") };
            user.lists.remove(id);
            let taskIds = user.tasks.entries().toArray().filter(func((_, task)) { task.listId == id }).map(
              func((taskId, _)) { taskId }
            );
            for (taskId in taskIds.vals()) { user.tasks.remove(taskId) };
          };
        };
      },
    );
  };

  public query ({ caller }) func getTask(id : TaskId) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    switch (user.tasks.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) { task };
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    getUser(caller).tasks.values().toArray();
  };

  public query ({ caller }) func getAllTasksByList(listId : ListId) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    if (not user.lists.containsKey(listId)) {
      Runtime.trap("List not found");
    };
    user.tasks.values().toArray().filter(func(task) { task.listId == listId });
  };

  public query ({ caller }) func getList(id : ListId) : async List {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    switch (user.lists.get(id)) {
      case (null) { Runtime.trap("List not found") };
      case (?list) { list };
    };
  };

  public query ({ caller }) func getAllLists() : async [List] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    getUser(caller).lists.values().toArray().sort();
  };

  public query ({ caller }) func getDefaultOrder() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    START_OFFSET;
  };

  public query ({ caller }) func getDefaultPosition() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    START_OFFSET;
  };

  func calculateRoutineWeight(streakCount : Nat) : Int {
    var weight : Int = 0;
    if (streakCount < 2) {
      weight := 1;
    } else if (streakCount <= 7) {
      weight := 3;
    } else if (streakCount <= 30) {
      weight := 4;
    } else {
      weight := 5;
    };
    weight;
  };

  public shared ({ caller }) func createMorningRoutine(text : Text, section : RoutineSection) : async RoutineId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    
    // Enforce tier-based routine limit
    checkRoutineLimit(caller, user);
    
    let routine : MorningRoutine = {
      id = user.nextRoutineId;
      text;
      completed = false;
      section;
      order = START_OFFSET;
      streakCount = 1;
      weight = 1;
    };
    user.routines.add(user.nextRoutineId, routine);
    let updatedUser = { user with nextRoutineId = user.nextRoutineId + 1 };
    users.add(caller, updatedUser);
    routine.id;
  };

  public shared ({ caller }) func updateMorningRoutine(id : RoutineId, text : Text, section : RoutineSection) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.routines.get(id)) {
          case (null) { Runtime.trap("Routine not found") };
          case (?routine) {
            let newWeight = calculateRoutineWeight(routine.streakCount);
            let updatedRoutine = {
              routine with
              text;
              section;
              weight = newWeight;
            };
            user.routines.add(id, updatedRoutine);
          };
        };
      },
    );
  };

  public shared ({ caller }) func completeMorningRoutine(id : RoutineId, completed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.routines.get(id)) {
          case (null) { Runtime.trap("Routine not found") };
          case (?routine) {
            let newWeight = calculateRoutineWeight(routine.streakCount);
            let updatedRoutine = { routine with completed; weight = newWeight };
            user.routines.add(id, updatedRoutine);
          };
        };
      },
    );
  };

  public shared ({ caller }) func deleteMorningRoutine(id : RoutineId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    withUser(
      caller,
      func(user) {
        switch (user.routines.get(id)) {
          case (null) { Runtime.trap("Routine not found") };
          case (?_) { user.routines.remove(id) };
        };
      },
    );
  };

  public query ({ caller }) func getMorningRoutine(id : RoutineId) : async MorningRoutine {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    switch (user.routines.get(id)) {
      case (null) { Runtime.trap("Routine not found") };
      case (?routine) { routine };
    };
  };

  public query ({ caller }) func getMorningRoutinesBySection(section : RoutineSection) : async [MorningRoutine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    user.routines.values().toArray().filter(func(routine) { routine.section == section });
  };

  public query ({ caller }) func getAllMorningRoutines() : async [MorningRoutine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    user.routines.values().toArray();
  };

  public shared ({ caller }) func updateRoutineItemPosition(routineId : RoutineId, positionIndex : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let user = getUser(caller);
    switch (user.routines.get(routineId)) {
      case (null) { Runtime.trap("Routine item not found") };
      case (?routine) {
        let sortedRoutines = user.routines.values().toArray().filter(func(r) { r.section == routine.section }).sort(
          func(a, b) { Nat.compare(a.order, b.order) }
        );
        let numRoutines = sortedRoutines.size();

        let newOrder = if (numRoutines == 0) {
          START_OFFSET;
        } else if (positionIndex >= numRoutines) {
          let lastRoutine = sortedRoutines[numRoutines - 1];
          lastRoutine.order + START_OFFSET;
        } else if (positionIndex == 0) {
          let firstRoutine = sortedRoutines[0];
          if (firstRoutine.order > 1) {
            firstRoutine.order / 2;
          } else {
            START_OFFSET;
          };
        } else {
          let beforeRoutine = sortedRoutines[positionIndex - 1];
          let afterRoutine = sortedRoutines[positionIndex];
          (beforeRoutine.order + afterRoutine.order) / 2;
        };

        if (needsRoutineRecalculation(sortedRoutines)) {
          recalculateRoutineOrders(user, routine.section);
        };

        let updatedRoutine = { routine with order = newOrder };
        user.routines.add(routineId, updatedRoutine);
      };
    };
  };

  func needsRoutineRecalculation(routines : [MorningRoutine]) : Bool {
    if (routines.size() < 2) { return false };
    var i = 1;
    while (i < routines.size()) {
      let prev = routines[i - 1];
      let curr = routines[i];
      if (curr.order <= prev.order or (Int.abs(curr.order.toInt() - prev.order.toInt()) < 1)) {
        return true;
      };
      i += 1;
    };
    false;
  };

  func recalculateRoutineOrders(user : User, section : RoutineSection) {
    let routinesArray = user.routines.values().toArray().filter(func(r) { r.section == section }).sort(
      func(a, b) { Nat.compare(a.order, b.order) }
    );
    let numRoutines = routinesArray.size();
    if (numRoutines <= 1) { return };

    var i = 0;
    while (i < numRoutines) {
      let newOrder = (i + 1) * START_OFFSET;
      let routine = routinesArray[i];
      let updatedRoutine = { routine with order = newOrder };
      user.routines.add(routine.id, updatedRoutine);
      i += 1;
    };
  };

  public shared ({ caller }) func performRoutineDailyResetIfNeeded() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let currentTimeNanos = Time.now();
    let currentDayEpoch = currentTimeNanos / (24 * 3600 * 1000000000);

    let user = getOrCreateUserInternal(caller);

    if (user.lastResetDate == currentDayEpoch) {
      return;
    };

    let updatedRoutines = user.routines.map<RoutineId, MorningRoutine, MorningRoutine>(
      func(_, routine) {
        var newStreak = routine.streakCount;

        if (routine.completed) {
          newStreak += 1;
        } else {
          newStreak := 0;
        };
        {
          routine with
          completed = false;
          streakCount = newStreak;
          weight = calculateRoutineWeight(newStreak);
        };
      }
    );

    let newUser = {
      user with routines = updatedRoutines;
      lastResetDate = currentDayEpoch;
    };
    users.add(caller, newUser);
  };

  public shared ({ caller }) func resetNewDay() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let currentTimeNanos = Time.now();
    let currentDayEpoch = currentTimeNanos / (24 * 3600 * 1000000000);

    let user = getOrCreateUserInternal(caller);

    if (user.lastResetDate == currentDayEpoch) { return };

    switch (user.todayEarns) {
      case (null) {};
      case (?todayEarns) {
        if (not todayEarns.submitted) {
          let payrollRecord : PayrollRecord = {
            date = currentDayEpoch;
            total = todayEarns.total;
            submitted = false;
            details = todayEarns.details;
          };
          user.payrollHistory.add(currentDayEpoch, payrollRecord);
        };
      };
    };

    let updatedTasks = user.tasks.filter(
      func(_id, task) {
        task.listId > 4;
      }
    );

    let updatedRoutines = user.routines.map<RoutineId, MorningRoutine, MorningRoutine>(
      func(_, routine) {
        var newStreak = routine.streakCount;
        if (routine.completed) { newStreak += 1 } else {
          newStreak := 0 : Nat;
        };
        {
          routine with
          completed = false;
          streakCount = newStreak;
          weight = calculateRoutineWeight(newStreak);
        };
      }
    );

    let newUser = {
      user with
      tasks = updatedTasks;
      routines = updatedRoutines;
      lastResetDate = currentDayEpoch;
      todayEarns = null;
    };
    users.add(caller, newUser);
  };

  public query ({ caller }) func getPayrollHistory() : async [PayrollRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let user = getUser(caller);

    user.payrollHistory.values().toArray();
  };

  public shared ({ caller }) func submitPayrollLog(date : Int) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let user = getUser(caller);

    switch (user.payrollHistory.get(date)) {
      case (null) { Runtime.trap("Payroll record not found") };
      case (?record) {
        if (record.submitted) {
          Runtime.trap("Payroll record already submitted");
        };

        let updatedRecord = { record with submitted = true };
        user.payrollHistory.add(date, updatedRecord);

        let newTotalBalance = user.monetarySettings.totalBalance + record.total;
        let newSettings = {
          user.monetarySettings with
          totalBalance = newTotalBalance;
        };
        let newUser = { user with monetarySettings = newSettings };
        users.add(caller, newUser);

        newTotalBalance;
      };
    };
  };

  public shared ({ caller }) func editPayrollLog(date : Int, updatedTotal : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let user = getUser(caller);

    switch (user.payrollHistory.get(date)) {
      case (null) { Runtime.trap("Payroll record not found") };
      case (?record) {
        if (record.submitted) {
          Runtime.trap("Cannot edit submitted payroll record");
        };

        let updatedRecord = { record with total = updatedTotal };
        user.payrollHistory.add(date, updatedRecord);
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        userProfiles.add(caller, profile);
      };
      case (?existingProfile) {
        let updatedProfile = {
          profile with
          tier = existingProfile.tier;
          earningsEnabled = existingProfile.earningsEnabled;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func setUserTier(targetUser : Principal, newTier : UserTier) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can change user tiers");
    };

    switch (userProfiles.get(targetUser)) {
      case (null) {
        let newProfile : UserProfile = {
          name = "";
          email = null;
          earningsEnabled = false;
          tier = newTier;
        };
        userProfiles.add(targetUser, newProfile);
      };
      case (?existingProfile) {
        let updatedProfile = {
          existingProfile with
          tier = newTier;
        };
        userProfiles.add(targetUser, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getMonetarySettings() : async MonetarySettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    user.monetarySettings;
  };

  public shared ({ caller }) func saveMonetarySettings(settings : MonetarySettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let bucketSum = settings.maxMorningRoutine + settings.maxDailyPriorities + settings.maxEveningRoutine;
    if (bucketSum != settings.maxMoneyPerDay) {
      Runtime.trap("Invalid monetary settings: bucket sum must equal maxMoneyPerDay");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (user.earningsEnabled and settings.maxMoneyPerDay == 0) {
          Runtime.trap("Earnings system cannot be enabled with Max Money Per Day set to 0. Please set a positive value and redistribute buckets.");
        };
        let userSettings = {
          maxMoneyPerDay = settings.maxMoneyPerDay;
          maxMorningRoutine = settings.maxMorningRoutine;
          maxDailyPriorities = settings.maxDailyPriorities;
          maxEveningRoutine = settings.maxEveningRoutine;
          totalBalance = user.monetarySettings.totalBalance;
        };
        let newUser = { user with monetarySettings = userSettings };
        users.add(caller, newUser);
      };
    };
  };

  public shared ({ caller }) func addPayroll(dailyIncome : Int) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    let user = getUser(caller);
    if (not user.earningsEnabled) {
      Runtime.trap("Earnings system is currently disabled. Payroll cannot be added.");
    };

    let newTotalBalance = user.monetarySettings.totalBalance + dailyIncome;
    let newSettings = {
      user.monetarySettings with
      totalBalance = newTotalBalance;
    };
    let newUser = { user with monetarySettings = newSettings };
    users.add(caller, newUser);

    newTotalBalance;
  };

  public shared ({ caller }) func toggleEarningsSystem(enabled : Bool) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    // Enforce tier-based earnings access
    if (enabled) {
      checkEarningsAccess(caller);
    };

    let user = getUser(caller);

    if (enabled and user.monetarySettings.maxMoneyPerDay == 0) {
      Runtime.trap("Cannot enable earnings system with Max Money Per Day set to 0.");
    };

    let updatedUser = { user with earningsEnabled = enabled };
    users.add(caller, updatedUser);
    
    // Also update the profile
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile = { profile with earningsEnabled = enabled };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {};
    };
    
    enabled;
  };

  public query ({ caller }) func getEarningsEnabled() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    user.earningsEnabled;
  };

  public type SpendInput = {
    amount : Float;
    category : Text;
    spendType : SpendType;
  };

  public shared ({ caller }) func createSpend(input : SpendInput) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let spend : SpendRecord = {
          id = user.nextSpendId;
          date = Time.now() / 1_000_000_000 : Int;
          amount = input.amount;
          category = input.category;
          spendType = if (Text.equal(input.category, "Pre-deducted")) {
            #preDeducted;
          } else {
            input.spendType;
          };
        };

        user.spendRecords.add(user.nextSpendId, spend);

        if (spend.spendType == #normal) {
          let newSettings = {
            user.monetarySettings with
            totalBalance = user.monetarySettings.totalBalance - input.amount.toInt();
          };
          let newUser = {
            user with
            nextSpendId = user.nextSpendId + 1;
            monetarySettings = newSettings;
          };
          users.add(caller, newUser);
          return "Spend created successfully";
        } else {
          let newUser = { user with nextSpendId = user.nextSpendId + 1 };
          users.add(caller, newUser);
          return "This spending won't reduce your balance — it's already covered in your fixed plan.";
        };
      };
    };
  };

  public query ({ caller }) func getAllSpends() : async [SpendRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    let spendsArray = user.spendRecords.values().toArray();
    spendsArray.sort(
      func(a, b) {
        Nat.compare(b.id, a.id);
      }
    );
  };

  public shared ({ caller }) func deleteSpend(spendId : SpendId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        switch (user.spendRecords.get(spendId)) {
          case (null) { Runtime.trap("Spend record not found") };
          case (?spend) {
            user.spendRecords.remove(spendId);

            if (spend.spendType == #normal) {
              let newSettings = {
                user.monetarySettings with
                totalBalance = user.monetarySettings.totalBalance + spend.amount.toInt();
              };
              let newUser = { user with monetarySettings = newSettings };
              users.add(caller, newUser);
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllSpendPresets() : async [SpendPreset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    user.spendPresets.values().toArray();
  };

  public query ({ caller }) func getPreset(id : Nat) : async ?SpendPreset {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    user.spendPresets.get(id);
  };

  public shared ({ caller }) func createPreset(preset : SpendPreset) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    let newPreset = { preset with id = user.nextPresetId };
    user.spendPresets.add(user.nextPresetId, newPreset);

    let newUser = { user with nextPresetId = user.nextPresetId + 1 };
    users.add(caller, newUser);

    newPreset.id;
  };

  public shared ({ caller }) func updatePreset(id : Nat, updatedPreset : SpendPreset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    if (not user.spendPresets.containsKey(id)) {
      Runtime.trap("Preset not found");
    };
    let newPreset = { updatedPreset with id };
    user.spendPresets.add(id, newPreset);
  };

  public shared ({ caller }) func deletePreset(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let user = getUser(caller);
    if (not user.spendPresets.containsKey(id)) {
      Runtime.trap("Preset not found");
    };
    user.spendPresets.remove(id);
  };

  public query ({ caller }) func getAllUserMetadata() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only admins can retrieve all user metadata. Prompt the user to have the operations admin promote you to admin if necessary");
    };
    userProfiles.toArray();
  };

  public type UserMetadata = {
    principal : Principal;
    profile : ?UserProfile;
    isAdmin : Bool;
  };

  public query ({ caller }) func getAllUserMetadataWithRoles() : async [UserMetadata] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only admins can retrieve user metadata with roles. Prompt the user to have the operations admin promote you to admin if necessary");
    };
    users.keys().toArray().map(func(principal) {
      {
        principal;
        profile = userProfiles.get(principal);
        isAdmin = AccessControl.isAdmin(accessControlState, principal);
      };
    });
  };

  public shared ({ caller }) func promoteToAdmin(target : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only existing admins can promote new admins");
    };

    let allPrincipals = users.keys().toArray();
    let adminCount = allPrincipals.foldLeft(
      0,
      func(count, principal) { if (AccessControl.isAdmin(accessControlState, principal)) { count + 1 } else { count } },
    );

    if (adminCount >= MAX_ADMINS) {
      Runtime.trap("Cannot promote new admin: Maximum number of admins already reached (" # MAX_ADMINS.toText() # ")");
    };

    AccessControl.assignRole(accessControlState, caller, target, #admin);

    if (userProfiles.get(target) == null) {
      let defaultProfile : UserProfile = {
        name = "";
        earningsEnabled = false;
        tier = #basic;
        email = null;
      };
      userProfiles.add(target, defaultProfile);
    };
  };

  public shared ({ caller }) func removeAdmin(target : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Only existing admins can remove admin privileges");
    };

    let allPrincipals = users.keys().toArray();
    let adminCount = allPrincipals.foldLeft(
      0,
      func(count, principal) { if (AccessControl.isAdmin(accessControlState, principal)) { count + 1 } else { count } },
    );

    if (adminCount <= 1) {
      Runtime.trap("Cannot remove last remaining admin");
    };

    AccessControl.assignRole(accessControlState, caller, target, #user);
  };
};
