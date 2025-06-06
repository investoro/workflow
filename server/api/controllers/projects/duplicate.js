const { idInput } = require('../../../utils/inputs');

module.exports = {
  inputs: {
    id: { ...idInput, required: true },
  },

  async fn(inputs) {
    const oldProject = await Project.qm.getOneById(inputs.id);
    const { currentUser } = this.req;

    if (!oldProject) {
      throw new Error('Projekt nie istnieje');
    }

    const originalProjectId = oldProject.id;
    delete oldProject.id;

    const { project } = await sails.helpers.projects.createOne.with({
      values: {
        ...oldProject,
        name: `${oldProject.name} (Kopia)`,
      },
      actorUser: currentUser,
      request: this.req,
    });

    const boards = await Board.find({ projectId: originalProjectId });

    for (const board of boards) {
      const originalBoardId = board.id;
      delete board.id;
      const newBoard = await Board.create({
        ...board,
        projectId: project.id,
      }).fetch();

      const boardMemberships = await BoardMembership.qm.getByBoardId(originalBoardId);
      const lists = await List.qm.getByBoardId(originalBoardId)
      const labels = await Label.qm.getByBoardId(originalBoardId);

      for (const boardMembership of boardMemberships) {
        delete boardMembership.id;
        await BoardMembership.qm.createOne({
          ...boardMembership,
          projectId: project.id,
          boardId: newBoard.id,
          userId: currentUser.id,
        });
      }

      for (const list of lists) {
        const originalListId = list.id;
        delete list.id;
        const { id: listId } = await List.qm.createOne({
          ...list,
          boardId: newBoard.id,
        });

        const cards = await Card.qm.getByListId(originalListId);

        for (const card of cards) {
          const originalCardId = card.id;
          delete card.id;
          const { id: cardId } = await Card.qm.createOne({
            ...card,
            boardId: newBoard.id,
            listId: listId,
          });

          // const cardMemberships = await CardMembership.qm.getByCardId(card.id);
          const cardLabels = await CardLabel.qm.getByCardId(originalCardId);
          const taskLists = await TaskList.qm.getByCardId(originalCardId);
          const attachments = await Attachment.qm.getByCardId(originalCardId);

          // for (const cardMembership of cardMemberships) {
          //   await CardMembership.qm.createOne({
          //     ...cardMembership,
          //     cardId: cardId,
          //   });
          // }

          for (const cardLabel of cardLabels) {
            delete cardLabel.id;
            await CardLabel.qm.createOne({
              ...cardLabel,
              cardId: cardId,
            });
          }

          for (const taskList of taskLists) {
            const originalTaskListId = taskList.id;
            delete taskList.id;
            const { id: taskListId } = await TaskList.qm.createOne({
              ...taskList,
              cardId: cardId,
            });

            const tasks = await Task.qm.getByTaskListId(originalTaskListId);

            for (const task of tasks) {
              delete task.id;
              await Task.qm.createOne({
                ...task,
                taskListId: taskListId,
              })
            }
          }

          for (const attachment of attachments) {
            delete attachment.id;
            await Attachment.qm.createOne({
              ...attachment,
              cardId: cardId,
            });
          }
        }
      }

      for (const label of labels) {
        delete label.id;
        await Label.qm.createOne({
          ...label,
          boardId: newBoard.id,
        });
      }
    }

    sails.sockets.broadcast(
      `user:${currentUser.id}`,
      'projectDuplicate',
      {
        item: project,
      },
      inputs.request,
    );

    return {
      item: project,
    };
  },
};
