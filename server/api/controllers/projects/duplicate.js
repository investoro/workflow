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

    const { id: originalProjectId, ...projectData } = oldProject;

    const { project } = await sails.helpers.projects.createOne.with({
      values: {
        ...projectData,
        name: `${projectData.name} (Kopia)`,
      },
      actorUser: currentUser,
      request: this.req,
    });

    const boards = await Board.find({ projectId: originalProjectId });

    await Promise.all(
      boards.map(async (board) => {
        const { id: originalBoardId, ...boardData } = board;
        const newBoard = await Board.create({
          ...boardData,
          projectId: project.id,
        }).fetch();

        const boardMemberships = await BoardMembership.qm.getByBoardId(originalBoardId);
        const lists = await List.qm.getByBoardId(originalBoardId);
        const labels = await Label.qm.getByBoardId(originalBoardId);

        await Promise.all(
          boardMemberships.map((boardMembership) => {
            const { id, ...bmData } = boardMembership;
            return BoardMembership.qm.createOne({
              ...bmData,
              projectId: project.id,
              boardId: newBoard.id,
              userId: currentUser.id,
            });
          }),
        );

        await Promise.all(
          lists.map(async (list) => {
            const { id: originalListId, ...listData } = list;
            const { id: listId } = await List.qm.createOne({
              ...listData,
              boardId: newBoard.id,
            });

            const cards = await Card.qm.getByListId(originalListId);

            await Promise.all(
              cards.map(async (card) => {
                const { id: originalCardId, ...cardData } = card;
                const { id: cardId } = await Card.qm.createOne({
                  ...cardData,
                  boardId: newBoard.id,
                  listId,
                });

                // const cardMemberships = await CardMembership.qm.getByCardId(card.id);
                const cardLabels = await CardLabel.qm.getByCardId(originalCardId);
                const taskLists = await TaskList.qm.getByCardId(originalCardId);
                const attachments = await Attachment.qm.getByCardId(originalCardId);

                // await Promise.all(cardMemberships.map(cardMembership =>
                //   CardMembership.qm.createOne({
                //     ...cardMembership,
                //     cardId: cardId,
                //   })
                // ));

                await Promise.all(
                  cardLabels.map((cardLabel) => {
                    const { id, ...cardLabelData } = cardLabel;
                    return CardLabel.qm.createOne({
                      ...cardLabelData,
                      cardId,
                    });
                  }),
                );

                await Promise.all(
                  taskLists.map(async (taskList) => {
                    const { id: originalTaskListId, ...taskListData } = taskList;
                    const { id: taskListId } = await TaskList.qm.createOne({
                      ...taskListData,
                      cardId,
                    });

                    const tasks = await Task.qm.getByTaskListId(originalTaskListId);

                    await Promise.all(
                      tasks.map((task) => {
                        const { id, ...taskData } = task;
                        return Task.qm.createOne({
                          ...taskData,
                          taskListId,
                        });
                      }),
                    );
                  }),
                );

                await Promise.all(
                  attachments.map((attachment) => {
                    const { id, ...attachmentData } = attachment;
                    return Attachment.qm.createOne({
                      ...attachmentData,
                      cardId,
                    });
                  }),
                );
              }),
            );
          }),
        );

        await Promise.all(
          labels.map((label) => {
            const { id, ...labelData } = label;
            return Label.qm.createOne({
              ...labelData,
              boardId: newBoard.id,
            });
          }),
        );
      }),
    );

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
